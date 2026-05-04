import type { PlaybackTime } from "@magritte/sdk/host"

import { useState, useCallback, useEffect } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"
import useNowPlaying from "@/hooks/nowPlayingHook"

export interface UsePlaybackTimeResult {
    readonly elapsedTime: number | null
    readonly totalTime: number | null
    readonly remainingTime: number | null
    readonly seekToTime: (newTime: number) => Promise<void>
    readonly isSeeking: boolean
}

export default function usePlaybackTime(): UsePlaybackTimeResult {
    const extensionHost = useExtensionHost()
    const nowPlaying = useNowPlaying()
    const [currentTime, setCurrentTime] = useState<PlaybackTime>({
        totalTime: null,
        elapsedTime: null,
    })
    const [isSeeking, setIsSeeking] = useState(false)

    useEffect(() => {
        if (isSeeking || nowPlaying.state !== "playing") {
            return
        }
        const update = async () => {
            const player = await extensionHost.player()
            const currentTime = await player.getCurrentTime()
            setCurrentTime(currentTime)
        }
        update()

        const interval = setInterval(() => {
            update()
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [isSeeking, nowPlaying.state, extensionHost])

    const seekToTime = useCallback(
        async (newTime: number) => {
            try {
                setIsSeeking(true)
                const player = await extensionHost.player()
                await player.seek({ newTime })
            } finally {
                setIsSeeking(false)
            }
        },
        [extensionHost],
    )

    const totalTime = currentTime.totalTime
    const elapsedTime = currentTime.elapsedTime
    const remainingTime =
        totalTime !== null && elapsedTime !== null ? totalTime - elapsedTime : null
    return {
        totalTime,
        elapsedTime,
        remainingTime,
        seekToTime,
        isSeeking,
    }
}
