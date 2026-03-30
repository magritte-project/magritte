import { getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

export type ExtensionManagerEvent =
    | { type: "extensionInstalled"; manifest: ExtensionManifest }
    | { type: "extensionAttached"; manifest: ExtensionManifest; parent: HTMLElement }
    | { type: "extensionDetached"; manifest: ExtensionManifest }
    | { type: "extensionUninstalled"; manifest: ExtensionManifest }

export interface ExtensionManagerAttachOptions {
    readonly parent?: HTMLElement
}

export class ExtensionManager {
    private readonly parkingLot: HTMLElement
    private readonly installedManifests: Map<string, ExtensionManifest>
    private readonly attachedIFrames: Map<string, HTMLIFrameElement>
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor(parkingLot: HTMLElement) {
        this.parkingLot = parkingLot
        this.installedManifests = new Map()
        this.attachedIFrames = new Map()
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionManagerEvent>

    get installed(): Iterable<ExtensionManifest> {
        return this.installedManifests.values()
    }

    install(manifest: ExtensionManifest) {
        if (this.installedManifests.has(manifest.id)) {
            throw new Error(`Extension already installed: ${manifest.id}`)
        }
        this.installedManifests.set(manifest.id, manifest)
    }

    attach(
        id: string,
        { parent = this.parkingLot }: ExtensionManagerAttachOptions = {},
    ): HTMLIFrameElement {
        const manifest = this.installedManifests.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not found: ${id}`)
        }
        let iframe = this.attachedIFrames.get(id)
        if (iframe === undefined) {
            iframe = document.createElement("iframe")
            iframe.width = "100%"
            iframe.height = "100%"
            iframe.src = getExtensionSrc(manifest, {
                hostOrigin: window.location.origin,
            })
            this.attachedIFrames.set(id, iframe)
        }
        if (iframe.parentElement !== parent) {
            parent.appendChild(iframe)
            this._events.dispatch({ type: "extensionAttached", manifest, parent })
        }
        return iframe
    }

    detach(id: string) {
        const manifest = this.installedManifests.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not found: ${id}`)
        }
        const iframe = this.attachedIFrames.get(id)
        if (iframe && iframe.parentElement !== this.parkingLot) {
            this.parkingLot.appendChild(iframe)
            this._events.dispatch({ type: "extensionDetached", manifest })
        }
    }

    uninstall(id: string) {
        const iframe = this.attachedIFrames.get(id)
        if (iframe) {
            iframe.parentElement?.removeChild(iframe)
            this.attachedIFrames.delete(id)
        }
        const manifest = this.installedManifests.get(id)
        if (manifest !== undefined) {
            this.installedManifests.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", manifest })
        }
    }
}
