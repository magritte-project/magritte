import { ExtensionData, ExtensionManifest, getExtensionSrc } from "../manifest"
import { createEvent, type EventSink, type EventStream } from "../utilities/events"
import {
    waitForExtensionConnection,
    type Extension,
    type WaitForExtensionConnectionOptions,
} from "./host"

type ExtensionInstanceState =
    | { status: "unloaded"; error?: unknown }
    | { status: "loading"; pendingExtension: Promise<Extension> }
    | { status: "loaded"; iframe: HTMLIFrameElement; extension: Extension }

export type ExtensionInstanceStatus = ExtensionInstanceState["status"]

export type ExtensionInstanceEvent = {
    type: "extensionInstanceStatusChanged"
    status: ExtensionInstanceStatus
}

export interface ExtensionInstanceOptions {
    readonly manifest: ExtensionManifest
}

export interface ExtensionInstanceLoadOptions extends Omit<
    WaitForExtensionConnectionOptions,
    "manifest" | "iframe"
> {
    readonly data?: ExtensionData
}

export class ExtensionInstance {
    private readonly _anchors: HTMLElement[]
    private readonly _resizeObserver: ResizeObserver
    private _state: ExtensionInstanceState
    private _events: EventSink<ExtensionInstanceEvent>

    constructor({ manifest }: ExtensionInstanceOptions) {
        this._anchors = []
        this._resizeObserver = new ResizeObserver(() => this._updateFrame())
        this._state = { status: "unloaded" }
        this.manifest = manifest
        ;[this._events, this.$events] = createEvent()
    }

    public readonly manifest: ExtensionManifest
    readonly $events: EventStream<ExtensionInstanceEvent>

    get status(): ExtensionInstanceStatus {
        return this._state.status
    }

    get extension() {
        if (this._state.status !== "loaded") {
            throw new Error("Extension is not loaded")
        }
        return this._state.extension
    }

    pushAnchor(anchor: HTMLElement) {
        if (this._anchors.length === 0) {
            this._resizeObserver.observe(document.body)
        } else {
            this._resizeObserver.unobserve(this._anchors[this._anchors.length - 1])
        }
        this._anchors.push(anchor)
        this._updateFrame()
    }

    removeAnchor(anchor: HTMLElement) {
        const index = this._anchors.indexOf(anchor)
        if (index !== -1) {
            if (index === this._anchors.length - 1) {
                this._resizeObserver.unobserve(this._anchors[index])
            }
            this._anchors.splice(index, 1)
        }
        if (this._anchors.length === 0) {
            this._resizeObserver.unobserve(document.body)
        }
    }

    private _updateFrame() {
        if (this._state.status !== "loaded") {
            return
        }

        const clientFrame = this._anchors[this._anchors.length - 1].getBoundingClientRect()
        this._state.iframe.style.left = `${clientFrame.x}px`
        this._state.iframe.style.top = `${clientFrame.y}px`
        this._state.iframe.style.width = `${clientFrame.width}px`
        this._state.iframe.style.height = `${clientFrame.height}px`
    }

    async load({ data, ...options }: ExtensionInstanceLoadOptions) {
        if (this._state.status === "loaded") {
            return
        }
        if (this._state.status === "loading") {
            await this._state.pendingExtension
            return
        }

        const iframe = document.createElement("iframe")
        iframe.style.background = "white"
        iframe.style.display = "none"
        iframe.style.position = "absolute"
        iframe.src = getExtensionSrc(this.manifest, {
            hostOrigin: window.location.origin,
            data,
        })
        document.body.appendChild(iframe)

        this._updateFrame()

        try {
            const pendingExtension = waitForExtensionConnection({
                iframe,
                manifest: this.manifest,
                ...options,
            })
            this._state = { status: "loading", pendingExtension }
            this._events.dispatch({ type: "extensionInstanceStatusChanged", status: "loading" })
            const extension = await pendingExtension
            if (this._state.status !== "loading") {
                extension.disconnect()
                document.body.removeChild(iframe)
                return
            }
            iframe.style.display = "block"
            this._state = { status: "loaded", iframe, extension }
            this._events.dispatch({ type: "extensionInstanceStatusChanged", status: "loaded" })
        } catch (error) {
            document.body.removeChild(iframe)
            this._state = { status: "unloaded", error }
            this._events.dispatch({ type: "extensionInstanceStatusChanged", status: "unloaded" })
        }
    }

    unload() {
        switch (this._state.status) {
            case "unloaded":
                break
            case "loading": {
                this._state = { status: "unloaded" }
                this._events.dispatch({
                    type: "extensionInstanceStatusChanged",
                    status: "unloaded",
                })
                break
            }
            case "loaded": {
                this._state.extension.disconnect()
                document.body.removeChild(this._state.iframe)
                this._state = { status: "unloaded" }
                this._events.dispatch({
                    type: "extensionInstanceStatusChanged",
                    status: "unloaded",
                })
                break
            }
        }
    }
}
