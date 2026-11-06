import type { ExtensionHost } from "./hosting/extensionHost"

/**
 * Options object for `beginForwardingMeaningfulUIEvents`.
 */
export interface BeginForwardingMeaningfulUIEventsOptions {
    /**
     * The element to listen for events which may be meaningful to
     * the extension host if not handled by the extension itself.
     * Defaults to `globalThis.document`.
     */
    readonly target?: GlobalEventHandlers
}

/**
 * A function that stops a events from being forwarded from an extension to its host.
 */
export type StopForwardingUIEvents = () => void

/**
 * Set up forwarding for events which are meaningful to the extension
 * host but have not been handled by this extension.
 *
 * This function should be called after `ExtensionHost.connect` and
 * before the extension finishes setting up its own user interface.
 *
 * @param host The extension's current host.
 * @param options Customizations for how event forwarding works.
 * @returns A promise for a function which will stop event forwarding if called.
 */
export async function beginForwardingMeaningfulUIEvents(
    host: ExtensionHost,
    { target = globalThis.document }: BeginForwardingMeaningfulUIEventsOptions = {},
): Promise<StopForwardingUIEvents> {
    const uiEvents = await host.uiEvents()
    const meaningfulKeyPresses = await uiEvents.getMeaningfulKeyPresses()
    const onKeyDown = (event: KeyboardEvent) => {
        const isMeaningful = meaningfulKeyPresses.some(
            (candidate) =>
                candidate.key === event.key &&
                candidate.metaKey === event.metaKey &&
                candidate.ctrlKey === event.ctrlKey &&
                candidate.shiftKey === event.shiftKey,
        )
        if (!isMeaningful) {
            return
        }
        event.stopPropagation()
        event.preventDefault()
        void uiEvents.forwardKeyPress([
            {
                key: event.key,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
            },
        ])
    }
    target.addEventListener("keydown", onKeyDown)
    return () => {
        target.removeEventListener("keydown", onKeyDown)
    }
}
