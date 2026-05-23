import { RPCBroadcaster } from "@magritte/rpc"
import { getExtensionSrc, type ExtensionManifest } from "@magritte/sdk"
import { Extension } from "@magritte/sdk/host"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

import type { APIClient } from "@/api/client"
import type { UserSessionManager } from "@/api/userSession"
import { exportLibrary } from "@/extensions/exports/Library"
import { exportPlayer } from "@/extensions/exports/Player"
import type { Player } from "@/playback/player"

export interface ExtensionRuntimeOptions {
    readonly container: HTMLElement
    readonly userSession: UserSessionManager
    readonly apiClient: APIClient
    readonly player: Player
}

export type ExtensionRuntimeEvent =
    | {
          /* An extension was added to the runtime */
          type: "extensionAdded"
          manifest: ExtensionManifest
      }
    | {
          /* An extension failed to load */
          type: "extensionLoadFailed"

          /** The manifest of the extension */
          manifest: ExtensionManifest

          /** The error that occurred while loading the extension */
          error: unknown
      }
    | {
          /* An extension was loaded */
          type: "extensionLoaded"

          /** The manifest of the extension */
          extension: Extension
      }
    | {
          /* An extension was unloaded */
          type: "extensionUnloaded"

          /** The extension that was unloaded */
          extension: Extension
      }
    | {
          /* An extension requested a toast be shown */
          type: "extensionRequestedToast"

          /** The manifest of the extension */
          manifest: ExtensionManifest

          /** The message of the toast */
          message: string

          /** The type of the toast */
          toastType: "error" | "success" | "info"
      }
    | {
          /* An extension was removed from the runtime */
          type: "extensionRemoved"

          /** The manifest of the extension */
          manifest: ExtensionManifest
      }

type ExtensionState =
    | { status: "unloaded" }
    | { status: "loading" }
    | { status: "loaded"; iframe: HTMLIFrameElement; extension: Extension }

export class ExtensionRuntime {
    /** The container the extension iframes are hosted in */
    private readonly _container: HTMLElement

    /** The user session */
    private readonly _userSession: UserSessionManager

    /** The API client */
    private readonly _apiClient: APIClient

    /** The player */
    private readonly _player: Player

    /** Tracks available extensions */
    private readonly _available: Map<string, ExtensionManifest>

    /** Tracks extension attachment points */
    private readonly _attachments: Map<string, ExtensionAttachment>

    /** Tracks loaded extensions */
    private readonly _extensions: Map<string, ExtensionState>

    private readonly _events: EventSink<ExtensionRuntimeEvent>

    constructor(options: ExtensionRuntimeOptions) {
        this._container = options.container
        this._userSession = options.userSession
        this._apiClient = options.apiClient
        this._player = options.player
        this._available = new Map()
        this._attachments = new Map()
        this._extensions = new Map()
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionRuntimeEvent>

    /** The currently available extensions */
    get available(): Iterable<ExtensionManifest> {
        return this._available.values()
    }

    /** The currently running extensions */
    get running(): Extension[] {
        return Array.from(this._extensions.values())
            .filter((s) => s.status === "loaded")
            .map((s) => s.extension)
    }

    add(manifest: ExtensionManifest) {
        if (this._available.has(manifest.id)) {
            this.remove(manifest.id)
        }
        this._available.set(manifest.id, manifest)

        console.debug("Extension added", manifest)
        this._events.dispatch({ type: "extensionAdded", manifest })

        if (manifest.autoLoad) {
            this._loadIfNeeded(manifest.id)
        }
    }

    remove(id: string): boolean {
        const manifest = this._available.get(id)
        if (manifest !== undefined) {
            this._unload(id)

            this._available.delete(id)

            console.debug("Extension Removed", manifest)
            this._events.dispatch({ type: "extensionRemoved", manifest })
            return true
        } else {
            return false
        }
    }

    async sync() {
        if (this._userSession.current === null) {
            for (const id of Array.from(this._available.keys())) {
                this.remove(id)
            }
            return
        }

        // TODO: Pagination
        const installedExtensions = await this._apiClient.readInstalledExtensions()
        const visitedIds = new Set<string>()
        for (const extension of installedExtensions.items) {
            // TODO: Fix mismatched types
            this.add({
                ...extension.manifest,
                description: extension.manifest.description ?? undefined,
                permissions: extension.manifest.permissions
                    ? [...extension.manifest.permissions]
                    : undefined,
                runInBackground: extension.manifest.runInBackground ?? undefined,
                autoLoad: extension.manifest.autoLoad ?? false,
                useCases: extension.manifest.useCases
                    ? [...extension.manifest.useCases]
                    : undefined,
            })
            visitedIds.add(extension.manifest.id)
        }
        for (const id of Array.from(this._available.keys())) {
            if (!visitedIds.has(id)) {
                this.remove(id)
            }
        }
    }

    private _getAttachment(id: string): ExtensionAttachment {
        let attachment = this._attachments.get(id)
        if (attachment === undefined) {
            attachment = new ExtensionAttachment()
            this._attachments.set(id, attachment)
        }
        return attachment
    }

    private async _load(id: string) {
        const manifest = this._available.get(id)
        if (manifest === undefined) {
            throw new Error()
        }

        const oldState = this._extensions.get(id) ?? { status: "unloaded" }
        if (oldState.status !== "unloaded") {
            throw new Error("Extension is already loaded")
        }

        console.debug("Begin loading extension", id)
        this._extensions.set(id, { status: "loading" })

        const iframe = document.createElement("iframe")
        iframe.style.background = "white"
        iframe.style.display = "none"
        iframe.style.position = "absolute"
        iframe.src = getExtensionSrc(manifest, {
            hostOrigin: window.location.origin,
        })
        this._container.appendChild(iframe)

        try {
            const broadcaster = new RPCBroadcaster()
            const extension = await Extension.waitForConnection({
                iframe,
                manifest,
                broadcaster,
                exports: {
                    chrome: {
                        showToast: async (options) => {
                            // NOTE: This is currently handled by <Wiring>
                            this._events.dispatch({
                                type: "extensionRequestedToast",
                                manifest,
                                message: options.message,
                                toastType: options.type,
                            })
                        },
                    },
                    library: exportLibrary(this._userSession.current, this._apiClient),
                    player: exportPlayer(broadcaster, this._player),
                },
            })

            const oldState = this._extensions.get(id) ?? { status: "unloaded" }
            if (oldState.status !== "loading") {
                console.debug("Cancelled loading extension", id)
                extension.disconnect()
                iframe.remove()
                return
            }

            const attachment = this._getAttachment(id)
            attachment.didLoad(iframe)

            console.debug("Loaded extension", id)
            this._extensions.set(id, { status: "loaded", iframe, extension })
            this._events.dispatch({ type: "extensionLoaded", extension })
        } catch (error) {
            iframe.remove()
            console.error("*** Could not load extension", manifest.id, error)
            this._extensions.set(id, { status: "unloaded" })
            this._events.dispatch({ type: "extensionLoadFailed", manifest, error })
        }
    }

    private async _loadIfNeeded(id: string) {
        const oldState = this._extensions.get(id) ?? { status: "unloaded" }
        if (oldState.status === "unloaded") {
            await this._load(id)
        }
    }

    private _unload(id: string): boolean {
        const state = this._extensions.get(id)
        if (state !== undefined) {
            if (state.status === "loaded") {
                state.iframe.remove()
                state.extension.disconnect()

                this._events.dispatch({ type: "extensionUnloaded", extension: state.extension })
            }
            this._extensions.delete(id)
            return true
        } else {
            return false
        }
    }

    attach(id: string, element: HTMLElement) {
        const attachment = this._getAttachment(id)
        attachment.attach(element)
        this._loadIfNeeded(id)
    }

    detach(id: string, element: HTMLElement) {
        const attachment = this._attachments.get(id)
        if (attachment === undefined) {
            return
        }
        attachment.detach(element)

        const manifest = this._available.get(id)
        if (!manifest?.runInBackground && !attachment.hasAnyElements) {
            this._unload(id)
        }
    }
}

class ExtensionAttachment {
    private readonly _resizeObserver: ResizeObserver
    private readonly _elements: HTMLElement[]
    private _iframe: HTMLIFrameElement | null

    constructor() {
        this._elements = []
        this._resizeObserver = new ResizeObserver(() => this._update())
        this._iframe = null
    }

    get hasAnyElements() {
        return this._elements.length > 0
    }

    private _update() {
        if (this._iframe === null) {
            return
        }
        if (this._elements.length > 0) {
            const clientFrame = this._elements[this._elements.length - 1].getBoundingClientRect()
            this._iframe.style.left = `${clientFrame.x}px`
            this._iframe.style.top = `${clientFrame.y}px`
            this._iframe.style.width = `${clientFrame.width}px`
            this._iframe.style.height = `${clientFrame.height}px`
            this._iframe.style.display = "block"
        } else {
            this._iframe.style.left = ""
            this._iframe.style.top = ""
            this._iframe.style.width = ""
            this._iframe.style.height = ""
            this._iframe.style.display = "none"
        }
    }

    attach(element: HTMLElement) {
        if (this._elements.length === 0) {
            this._resizeObserver.observe(document.body)
        } else {
            this._resizeObserver.unobserve(this._elements[this._elements.length - 1])
        }
        this._resizeObserver.observe(element)
        this._elements.push(element)
    }

    detach(element: HTMLElement) {
        const toRemove = this._elements.indexOf(element)
        if (toRemove !== -1) {
            if (toRemove === this._elements.length - 1) {
                this._resizeObserver.unobserve(element)
            }
            this._elements.splice(toRemove, 1)
            if (this._elements.length === 0) {
                this._resizeObserver.unobserve(document.body)
            }
        }
        this._update()
    }

    didLoad(iframe: HTMLIFrameElement) {
        this._iframe = iframe
        this._update()
    }

    didUnload(iframe: HTMLIFrameElement) {
        if (iframe !== this._iframe) {
            throw new Error("iframe does not match the current iframe")
        }
        this._iframe.style.display = "none"
        this._iframe = null
        this._update()
    }
}
