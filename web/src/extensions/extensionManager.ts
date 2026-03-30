import { getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import {
    waitForExtensionConnection,
    type Extension,
    type WaitForExtensionConnectionOptions,
} from "@magritte/sdk/connection"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

export class InstalledExtension {
    private _iframe: HTMLIFrameElement | null
    private _extension: Extension | null

    constructor(readonly manifest: ExtensionManifest) {
        this._iframe = null
        this._extension = null
    }

    get extension() {
        return this._extension
    }

    loadIfNeeded() {
        if (this._iframe !== null) {
            return
        }
        this._iframe = document.createElement("iframe")
        this._iframe.style.position = "absolute"
        this._iframe.style.left = "0"
        this._iframe.style.top = "0"
        this._iframe.style.width = "0"
        this._iframe.style.height = "0"
        this._iframe.src = getExtensionSrc(this.manifest, {
            hostOrigin: window.location.origin,
        })
        document.body.appendChild(this._iframe)
    }

    position(boundingClientRect: DOMRect) {
        if (this._iframe === null) {
            return
        }
        this._iframe.style.left = `${boundingClientRect.x}px`
        this._iframe.style.top = `${boundingClientRect.y}px`
        this._iframe.style.width = `${boundingClientRect.width}px`
        this._iframe.style.height = `${boundingClientRect.height}px`
    }

    async connect(options: Omit<WaitForExtensionConnectionOptions, "iframe" | "manifest">) {
        if (this._iframe === null) {
            throw new Error("Cannot connect to extension: iframe is not loaded")
        }
        this._extension = await waitForExtensionConnection({
            ...options,
            iframe: this._iframe,
            manifest: this.manifest,
        })
    }

    unload() {
        if (this._extension !== null) {
            this._extension?.connection.invalidate()
            this._extension = null
        }
        if (this._iframe !== null) {
            document.body.removeChild(this._iframe)
            this._iframe = null
        }
    }
}

export type ExtensionManagerEvent =
    | { type: "extensionInstalled"; installedExtension: InstalledExtension }
    | { type: "extensionUninstalled"; installedExtension: InstalledExtension }

export class ExtensionManager {
    private readonly _installed: Map<string, InstalledExtension>
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor() {
        this._installed = new Map()
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionManagerEvent>

    get installed(): Iterable<InstalledExtension> {
        return this._installed.values()
    }

    install(manifest: ExtensionManifest) {
        if (this._installed.has(manifest.id)) {
            throw new Error(`Extension already installed: ${manifest.id}`)
        }
        const installedExtension = new InstalledExtension(manifest)
        this._installed.set(manifest.id, installedExtension)
        this._events.dispatch({ type: "extensionInstalled", installedExtension })
    }

    uninstall(id: string) {
        const installedExtension = this._installed.get(id)
        if (installedExtension !== undefined) {
            installedExtension.unload()
            this._installed.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", installedExtension })
        }
    }
}
