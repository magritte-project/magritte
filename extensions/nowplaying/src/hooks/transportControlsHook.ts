import { useCallback } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"

export interface UseTransportControlsResult {
    readonly resume: () => Promise<void>
    readonly pause: () => Promise<void>
    readonly skipPrevious: () => Promise<void>
    readonly skipNext: () => Promise<void>
}

export default function useTransportControls(): UseTransportControlsResult {
    const extensionHost = useExtensionHost()

    const resume = useCallback(async () => {
        const player = await extensionHost.player()
        await player.resume()
    }, [extensionHost])

    const pause = useCallback(async () => {
        const player = await extensionHost.player()
        await player.pause()
    }, [extensionHost])

    const skipPrevious = useCallback(async () => {
        const player = await extensionHost.player()
        await player.skipPrevious()
    }, [extensionHost])

    const skipNext = useCallback(async () => {
        const player = await extensionHost.player()
        await player.skipNext()
    }, [extensionHost])

    return {
        resume,
        pause,
        skipPrevious,
        skipNext,
    }
}
