import { getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import { Extension, type ExtensionWaitForConnectionOptions } from "@magritte/sdk/host"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

export type ExtensionInstanceEvent =
    | {
          type: "extensionInstanceWillLoad"
          instance: ExtensionInstance
      }
    | { type: "extensionInstanceLoaded"; instance: ExtensionInstance }
    | { type: "extensionInstanceLoadFailed"; error: unknown; instance: ExtensionInstance }
    | { type: "extensionInstanceUnloaded"; instance: ExtensionInstance }

export interface ExtensionInstanceLoadOptions extends Omit<
    ExtensionWaitForConnectionOptions,
    "iframe" | "manifest"
> {
    readonly clientFrame: DOMRect
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
        if (this._extension == null) {
            throw new Error("Extension is not loaded")
        }
        return this._extension
    }

    async load({ clientFrame, ...options }: ExtensionInstanceLoadOptions) {
        if (this._iframe !== null || this._extension !== null) {
            throw new Error("Cannot load extension: iframe is already loaded")
        }

        this._events.dispatch({ type: "extensionInstanceWillLoad", instance: this })

        this._iframe = document.createElement("iframe")
        this._iframe.style.background = "white"
        this._iframe.style.display = "none"
        this._iframe.style.position = "absolute"
        this.updateClientFrame(clientFrame)
        this._iframe.src = getExtensionSrc(this.manifest, {
            hostOrigin: window.location.origin,
        })
        document.body.appendChild(this._iframe)

        try {
            this._extension = await Extension.waitForConnection({
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

            this._events.dispatch({ type: "extensionInstanceLoaded", instance: this })
        } catch (error) {
            console.error("*** Could not load extension", this.manifest.id, error)
            this._events.dispatch({ type: "extensionInstanceLoadFailed", error, instance: this })
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

            this._events.dispatch({ type: "extensionInstanceUnloaded", instance: this })
        }
        if (this._iframe !== null) {
            document.body.removeChild(this._iframe)
            this._iframe = null
        }
    }
}
