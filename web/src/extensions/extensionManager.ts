import { getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

export type ExtensionManagerEvent =
    | { type: "extensionInstalled"; manifest: ExtensionManifest }
    | { type: "extensionLoaded"; manifest: ExtensionManifest }
    | { type: "extensionUnloaded"; manifest: ExtensionManifest }
    | { type: "extensionUninstalled"; manifest: ExtensionManifest }

export class ExtensionManager {
    private readonly manifests: Map<string, ExtensionManifest>
    private readonly iframes: Map<string, HTMLIFrameElement>
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor() {
        this.manifests = new Map()
        this.iframes = new Map()
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionManagerEvent>

    get installed(): Iterable<ExtensionManifest> {
        return this.manifests.values()
    }

    install(manifest: ExtensionManifest) {
        if (this.manifests.has(manifest.id)) {
            throw new Error(`Extension already installed: ${manifest.id}`)
        }
        this.manifests.set(manifest.id, manifest)
    }

    load(id: string): HTMLIFrameElement {
        const manifest = this.manifests.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not found: ${id}`)
        }
        let iframe = this.iframes.get(id)
        if (iframe === undefined) {
            iframe = document.createElement("iframe")
            iframe.style.position = "absolute"
            iframe.style.left = "0"
            iframe.style.top = "0"
            iframe.style.width = "0"
            iframe.style.height = "0"
            iframe.src = getExtensionSrc(manifest, {
                hostOrigin: window.location.origin,
            })
            document.body.appendChild(iframe)
            this.iframes.set(id, iframe)
            this._events.dispatch({ type: "extensionLoaded", manifest })
        }
        return iframe
    }

    position(id: string, boundingClientRect: DOMRect) {
        const iframe = this.iframes.get(id)
        if (iframe === undefined) {
            return
        }
        iframe.style.left = `${boundingClientRect.x}px`
        iframe.style.top = `${boundingClientRect.y}px`
        iframe.style.width = `${boundingClientRect.width}px`
        iframe.style.height = `${boundingClientRect.height}px`
    }

    unload(id: string) {
        const manifest = this.manifests.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not found: ${id}`)
        }
        const iframe = this.iframes.get(id)
        if (iframe) {
            document.body.removeChild(iframe)
            this.iframes.delete(id)
            this._events.dispatch({ type: "extensionUnloaded", manifest })
        }
    }

    uninstall(id: string) {
        const iframe = this.iframes.get(id)
        if (iframe) {
            iframe.parentElement?.removeChild(iframe)
            this.iframes.delete(id)
        }
        const manifest = this.manifests.get(id)
        if (manifest !== undefined) {
            this.manifests.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", manifest })
        }
    }
}
