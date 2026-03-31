import { ExtensionData, getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import {
    waitForExtensionConnection,
    type Extension,
    type WaitForExtensionConnectionOptions,
} from "@magritte/sdk/connection"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

export type ExtensionInstanceEvent =
    | { type: "extensionInstanceWillLoad" }
    | { type: "extensionInstanceLoaded" }
    | { type: "extensionInstanceLoadFailed"; error: unknown }
    | { type: "extensionInstanceUnloaded" }

export interface ExtensionInstanceLoadOptions extends Omit<
    WaitForExtensionConnectionOptions,
    "iframe" | "manifest"
> {
    readonly clientFrame: DOMRect
    readonly data?: ExtensionData
}

export class ExtensionInstance {
    private _iframe: HTMLIFrameElement | null
    private _extension: Extension | null
    private _events: EventSink<ExtensionInstanceEvent>

    constructor(readonly manifest: ExtensionManifest) {
        this._iframe = null
        this._extension = null
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionInstanceEvent>

    get isLoaded() {
        return this._iframe !== null && this.extension !== null
    }

    get extension() {
        return this._extension
    }

    async load({ clientFrame, data, ...options }: ExtensionInstanceLoadOptions) {
        if (this._iframe !== null || this._extension !== null) {
            throw new Error("Cannot load extension: iframe is already loaded")
        }

        this._events.dispatch({ type: "extensionInstanceWillLoad" })

        this._iframe = document.createElement("iframe")
        this._iframe.style.background = "white"
        this._iframe.style.display = "none"
        this._iframe.style.position = "absolute"
        this.updateClientFrame(clientFrame)
        this._iframe.src = getExtensionSrc(this.manifest, {
            hostOrigin: window.location.origin,
            data,
        })
        document.body.appendChild(this._iframe)

        try {
            this._extension = await waitForExtensionConnection({
                iframe: this._iframe,
                manifest: this.manifest,
                ...options,
            })

            if (this._iframe === null) {
                // NOTE: The iframe can be removed before the connection handshake
                //       completes. A common scenario this happens in is when React
                //       is running in debug mode and runs effects twice.
                console.debug("*** Extension load cancelled", this.manifest.id)
                this._extension.disconnect()
                this._extension = null
                return
            }

            this._iframe.style.display = "block"

            this._events.dispatch({ type: "extensionInstanceLoaded" })
        } catch (error) {
            console.error("*** Could not load extension", this.manifest.id, error)
            this._events.dispatch({ type: "extensionInstanceLoadFailed", error })
            this.unload()
        }
    }

    updateClientFrame(clientFrame: DOMRect) {
        if (this._iframe === null) {
            return
        }
        this._iframe.style.left = `${clientFrame.x}px`
        this._iframe.style.top = `${clientFrame.y}px`
        this._iframe.style.width = `${clientFrame.width}px`
        this._iframe.style.height = `${clientFrame.height}px`
    }

    unload() {
        if (this._extension !== null) {
            this._extension.disconnect()
            this._extension = null

            this._events.dispatch({ type: "extensionInstanceUnloaded" })
        }
        if (this._iframe !== null) {
            document.body.removeChild(this._iframe)
            this._iframe = null
        }
    }
}

export type ExtensionManagerEvent =
    | { type: "extensionInstalled"; manifest: ExtensionManifest }
    | {
          type: "extensionInstanceAcquired"
          instance: ExtensionInstance
      }
    | {
          type: "extensionInstanceReleased"
          instance: ExtensionInstance
      }
    | { type: "extensionUninstalled"; manifest: ExtensionManifest }

export class ExtensionManager {
    private readonly _installed: Map<string, ExtensionManifest>
    private _instances: ExtensionInstance[]
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor() {
        this._installed = new Map()
        this._instances = []
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionManagerEvent>

    get installed(): Iterable<ExtensionManifest> {
        return this._installed.values()
    }

    install(manifest: ExtensionManifest) {
        if (this._installed.has(manifest.id)) {
            throw new Error(`Extension already installed: ${manifest.id}`)
        }
        this._installed.set(manifest.id, manifest)
        this._events.dispatch({ type: "extensionInstalled", manifest })
    }

    acquireInstance(id: string): ExtensionInstance {
        const manifest = this._installed.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not installed: ${id}`)
        }
        if (
            !manifest.allowsMultipleInstances &&
            this._instances.some((instance) => instance.manifest.id === id)
        ) {
            throw new Error(`Extension already has an instance: ${id}`)
        }
        const instance = new ExtensionInstance(manifest)
        this._instances.push(instance)
        this._events.dispatch({ type: "extensionInstanceAcquired", instance })
        return instance
    }

    releaseInstance(instance: ExtensionInstance) {
        const toRemove = this._instances.indexOf(instance)
        if (toRemove !== -1) {
            const instance = this._instances[toRemove]
            instance.unload()
            this._instances.splice(toRemove, 1)
            this._events.dispatch({ type: "extensionInstanceReleased", instance })
        }
    }

    uninstall(id: string) {
        const manifest = this._installed.get(id)
        if (manifest !== undefined) {
            for (const instance of this._instances) {
                if (instance.manifest.id === id) {
                    this.releaseInstance(instance)
                }
            }
            this._installed.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", manifest })
        }
    }
}
