import { useEffect, useState, useSyncExternalStore } from "react"

interface RelatedApplication {
    readonly platform: string
    readonly id?: string
    readonly url?: string
    readonly version?: string
}

declare global {
    interface Navigator {
        /**
         * Lists the apps related to this one which are installed on the device. Only available
         * in Chromium browsers, and only over secure connections.
         *
         * See https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getInstalledRelatedApps
         */
        readonly getInstalledRelatedApps?: () => Promise<readonly RelatedApplication[]>

        /**
         * Whether the app is running from the home screen. Only available in Safari.
         */
        readonly standalone?: boolean
    }
}

/**
 * The display modes a browser reports when the app has its own window instead of a tab.
 */
const installedDisplayModes = [
    "(display-mode: standalone)",
    "(display-mode: minimal-ui)",
    "(display-mode: fullscreen)",
    "(display-mode: window-controls-overlay)",
]

let installedDisplayModeQueries: readonly MediaQueryList[] | undefined

function getInstalledDisplayModeQueries(): readonly MediaQueryList[] {
    return (installedDisplayModeQueries ??= installedDisplayModes.map((displayMode) =>
        matchMedia(displayMode),
    ))
}

function subscribeToDisplayMode(onStoreChange: () => void): () => void {
    const queries = getInstalledDisplayModeQueries()
    for (const query of queries) {
        query.addEventListener("change", onStoreChange)
    }
    return () => {
        for (const query of queries) {
            query.removeEventListener("change", onStoreChange)
        }
    }
}

function getDisplayModeSnapshot(): boolean {
    return (
        navigator.standalone === true ||
        getInstalledDisplayModeQueries().some((query) => query.matches)
    )
}

/**
 * Get whether the app is running as an installed PWA rather than inside a browser tab.
 *
 * Prefers `navigator.getInstalledRelatedApps`, which requires the manifest to relate
 * itself through `related_applications`, and falls back to the display mode the browser
 * is rendering the app with for browsers which don't implement it.
 */
export default function useIsInstalledApp(): boolean {
    const isInstalledDisplayMode = useSyncExternalStore(
        subscribeToDisplayMode,
        getDisplayModeSnapshot,
    )
    const [hasInstalledRelatedApp, setHasInstalledRelatedApp] = useState(false)
    useEffect(() => {
        const { getInstalledRelatedApps } = navigator
        if (getInstalledRelatedApps === undefined) {
            return
        }
        let isCurrent = true
        getInstalledRelatedApps
            .call(navigator)
            .then((relatedApps) => {
                if (isCurrent) {
                    setHasInstalledRelatedApp(
                        relatedApps.some(({ platform }) => platform === "webapp"),
                    )
                }
            })
            .catch((error: unknown) => {
                console.error("*** Could not check for installed related apps:", error)
            })
        return () => {
            isCurrent = false
        }
    }, [])
    return isInstalledDisplayMode || hasInstalledRelatedApp
}
