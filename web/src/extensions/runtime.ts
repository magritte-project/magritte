import type { API, ExtensionManifest } from "@magritte/api"
import { Extension, getExtensionAllow, getExtensionSrc } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"

import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import { exportCommandCoordinator } from "@/extensions/exports/exportCommandCoordinator"
import { exportLibrary } from "@/extensions/exports/exportLibrary"
import { exportNotificationCenter } from "@/extensions/exports/exportNotificationCenter"
import { exportPlayer } from "@/extensions/exports/exportPlayer"
import type { NotificationCenter } from "@/notifications/center"
import type { Player } from "@/playback/player"
import {
    createEvent,
    justEventsMatching,
    type EventDispatch,
    type EventSubscribe,
} from "@/utilities/events"

export interface ExtensionRuntimeOptions {
    readonly container: HTMLElement
    readonly commandInputs: CommandInputs
    readonly commandRegistry: CommandRegistry
    readonly queryClient: QueryClient
    readonly api: API
    readonly notificationCenter: NotificationCenter
    readonly player: Player
}

export type ExtensionRuntimeEvent =
    | {
          /* An extension was added to the runtime */
          type: "extensionAdded"
          manifest: ExtensionManifest
      }
    | {
          /** An extension has started loading */
          type: "extensionLoadStart"

          /** The manifest of the extension */
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
          /* An extension was removed from the runtime */
          type: "extensionRemoved"

          /** The manifest of the extension */
          manifest: ExtensionManifest
      }

type ExtensionState =
    | { status: "unloaded" }
    | { status: "loading"; abortController: AbortController }
    | { status: "loaded"; iframe: HTMLIFrameElement; extension: Extension }

export class ExtensionRuntime {
    /** The container the extension iframes are hosted in */
    private readonly _container: HTMLElement

    /** The command inputs */
    private readonly _commandInputs: CommandInputs

    /** The command registry */
    private readonly _commandRegistry: CommandRegistry

    /** The query client */
    private readonly _queryClient: QueryClient

    /** The API */
    private readonly _api: API

    /** The notification center */
    private readonly _notificationCenter: NotificationCenter

    /** The player */
    private readonly _player: Player

    /** Tracks available extensions */
    private readonly _available: Map<string, ExtensionManifest>

    /** Tracks extension attachment points */
    private readonly _attachments: Map<string, ExtensionAttachment>

    /** Tracks loaded extensions */
    private readonly _extensions: Map<string, ExtensionState>

    private readonly _dispatch: EventDispatch<ExtensionRuntimeEvent>

    constructor(options: ExtensionRuntimeOptions) {
        this._container = options.container
        this._commandInputs = options.commandInputs
        this._commandRegistry = options.commandRegistry
        this._queryClient = options.queryClient
        this._api = options.api
        this._notificationCenter = options.notificationCenter
        this._player = options.player
        this._available = new Map()
        this._attachments = new Map()
        this._extensions = new Map()
        ;[this._dispatch, this.subscribe] = createEvent({ label: "ExtensionRuntime" })

        this._api.userEventsManager.subscribe(
            justEventsMatching("event_type", "extensions_changed", () => this.sync()),
        )
        this._api.userSessionManager.subscribe(
            justEventsMatching("type", "currentChanged", () => this.sync()),
        )
    }

    readonly subscribe: EventSubscribe<ExtensionRuntimeEvent>

    /** The currently available extensions */
    get available(): Iterable<ExtensionManifest> {
        return this._available.values()
    }

    /** The currently loading extensions, if any */
    get loading(): Iterable<ExtensionManifest> {
        function* iterateLoading(runtime: ExtensionRuntime) {
            for (const [id, state] of runtime._extensions.entries()) {
                if (state.status !== "loading") {
                    continue
                }
                const manifest = runtime._available.get(id)
                if (!manifest) {
                    continue
                }
                yield manifest
            }
        }
        return iterateLoading(this)
    }

    /** The currently running extensions */
    get running(): Extension[] {
        return Array.from(this._extensions.values())
            .filter((s) => s.status === "loaded")
            .map((s) => s.extension)
    }

    isLoading(id: string): boolean {
        const state = this._extensions.get(id)
        return state?.status === "loading"
    }

    /** Get a currently running extension */
    getRunning(id: string): Extension | null {
        const state = this._extensions.get(id)
        return state?.status === "loaded" ? state.extension : null
    }

    /**
     * Terminate a loading or running extension.
     *
     * @param id The manifest ID of the extension.
     * @throws {Error} If the extension is not found or not loaded.
     */
    terminate(id: string) {
        if (!this._unload(id)) {
            throw new Error(`Extension not loaded: ${id}`)
        }
    }

    add(manifest: ExtensionManifest) {
        if (this._available.has(manifest.id)) {
            this.remove(manifest.id)
        }
        this._available.set(manifest.id, manifest)

        console.debug("Extension added", manifest)
        this._dispatch({ type: "extensionAdded", manifest })

        if (manifest.permissions?.includes("run:eager")) {
            this._loadIfNeeded(manifest.id)
        }
    }

    remove(id: string): boolean {
        const manifest = this._available.get(id)
        if (manifest !== undefined) {
            this._unload(id)

            this._available.delete(id)

            console.debug("Extension Removed", manifest)
            this._dispatch({ type: "extensionRemoved", manifest })
            return true
        } else {
            return false
        }
    }

    async sync() {
        if (this._api.userSessionManager.current === null) {
            for (const id of Array.from(this._available.keys())) {
                this.remove(id)
            }
            return
        }

        // TODO: Pagination
        const installedExtensions = await this._api.client.readInstalledExtensions()
        const visitedIds = new Set<string>()
        for (const extension of installedExtensions.items) {
            // TODO: Fix mismatched types
            this.add({
                ...extension.manifest,
                description: extension.manifest.description ?? undefined,
                preferredWidth: extension.manifest.preferredWidth ?? undefined,
                preferredHeight: extension.manifest.preferredHeight ?? undefined,
                permissions: extension.manifest.permissions
                    ? [...extension.manifest.permissions]
                    : undefined,
                sourceSchemes: extension.manifest.sourceSchemes
                    ? [...extension.manifest.sourceSchemes]
                    : undefined,
                commands: extension.manifest.commands
                    ? extension.manifest.commands.map((command) => ({
                          ...command,
                          requiredInputKinds: [...command.requiredInputKinds],
                      }))
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
        const abortController = new AbortController()
        abortController.signal.addEventListener("abort", () => {
            const state = this._extensions.get(id)
            if (!state || state.status !== "loading" || state.abortController !== abortController) {
                return
            }
            iframe.remove()
            console.debug("*** Aborted loading extension", id)
            this._extensions.set(id, { status: "unloaded" })
            this._dispatch({
                type: "extensionLoadFailed",
                manifest,
                error: new Error("Aborted extension load"),
            })
        })
        this._extensions.set(id, { status: "loading", abortController })
        this._dispatch({ type: "extensionLoadStart", manifest })

        const iframe = document.createElement("iframe")
        try {
            // Transparent so extensions can use translucent backgrounds over the blur
            iframe.style.background = "transparent"
            iframe.style.borderRadius = "12px"
            iframe.style.backdropFilter = "blur(20px)"
            iframe.style.display = "none"
            iframe.style.position = "absolute"
            iframe.allow = getExtensionAllow(manifest)
            iframe.src = getExtensionSrc(manifest, {
                hostOrigin: window.location.origin,
            })
            // TODO: this is a hack
            this._container.insertBefore(iframe, this._container.querySelector("#app-modals"))

            const extension = await Extension.waitForConnection({
                iframe,
                manifest,
                signal: abortController.signal,
                exports: async ({ manifest, broadcaster }) => ({
                    commandCoordinator: exportCommandCoordinator(
                        manifest,
                        broadcaster,
                        this._commandInputs,
                        this._commandRegistry,
                    ),
                    notificationCenter: exportNotificationCenter(this._notificationCenter),
                    library: exportLibrary(manifest, this._queryClient, this._api),
                    player: exportPlayer(manifest, broadcaster, this._player),
                }),
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
            this._dispatch({ type: "extensionLoaded", extension })
        } catch (error) {
            if (!iframe.parentElement) {
                // ^^ <iframe> was removed before load could complete, ignore
                return
            }
            iframe.remove()
            console.error("*** Could not load extension", manifest.id, error)
            this._extensions.set(id, { status: "unloaded" })
            this._dispatch({ type: "extensionLoadFailed", manifest, error })
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
            switch (state.status) {
                case "unloaded":
                    return false
                case "loading":
                    state.abortController.abort()
                    break
                case "loaded":
                    state.iframe.remove()
                    state.extension.disconnect()
                    this._dispatch({ type: "extensionUnloaded", extension: state.extension })
                    break
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
        if (!manifest?.permissions?.includes("run:background") && !attachment.hasAnyElements) {
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
            console.debug(
                "ExtensionAttachment: Stopped observing",
                this._elements[this._elements.length - 1],
            )
        }
        this._resizeObserver.observe(element)
        this._elements.push(element)
        console.debug("ExtensionAttachment: Started observing", element)
    }

    detach(element: HTMLElement) {
        const toRemove = this._elements.indexOf(element)
        if (toRemove !== -1) {
            if (toRemove === this._elements.length - 1) {
                this._resizeObserver.unobserve(element)
                console.debug(
                    "ExtensionAttachment: Stopped observing",
                    this._elements[this._elements.length - 1],
                )
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
