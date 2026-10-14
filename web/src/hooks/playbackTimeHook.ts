import type { PlaybackTime } from "@magritte/sdk"
import { useCallback, useEffect, useState } from "react"

import usePlayer from "@/hooks/playerHook"

export interface UsePlaybackTimeResult {
    readonly elapsedTime: number | null
    readonly totalTime: number | null
    readonly remainingTime: number | null
    readonly seekToTime: (newTime: number) => Promise<void>
    readonly isSeeking: boolean
}

export default function usePlaybackTime(): UsePlaybackTimeResult {
    const player = usePlayer()
    const [currentTime, setCurrentTime] = useState<PlaybackTime>({
        totalTime: null,
        elapsedTime: null,
    })
    const [isSeeking, setIsSeeking] = useState(false)
    const updateCurrentTime = useCallback(async () => {
        const currentTime = await player.getCurrentTime()
        setCurrentTime(currentTime)
    }, [player])
    useEffect(() => {
        if (isSeeking || player.playbackState !== "playing") {
            return
        }
        const interval = setInterval(() => {
            void updateCurrentTime()
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [isSeeking, player.playbackState, updateCurrentTime])
    const totalTime = currentTime.totalTime
    const elapsedTime = currentTime.elapsedTime
    const remainingTime =
        totalTime !== null && elapsedTime !== null ? totalTime - elapsedTime : null
    const seekToTime = useCallback(
        async (newTime: number) => {
            try {
                setIsSeeking(true)
                await player.seek(newTime)
                await updateCurrentTime()
            } finally {
                setIsSeeking(false)
            }
        },
        [player, updateCurrentTime],
    )
    return {
        totalTime,
        elapsedTime,
        remainingTime,
        seekToTime,
        isSeeking,
    }
}
