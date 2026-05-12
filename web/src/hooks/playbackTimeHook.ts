import type { PlaybackTime } from "@magritte/sdk/host"
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
    useEffect(() => {
        if (isSeeking || player.playbackState !== "playing") {
            return
        }
        const update = async () => {
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
    }, [player, isSeeking, player.playbackState])
    const totalTime = currentTime.totalTime
    const elapsedTime = currentTime.elapsedTime
    const remainingTime =
        totalTime !== null && elapsedTime !== null ? totalTime - elapsedTime : null
    const seekToTime = useCallback(
        async (newTime: number) => {
            try {
                setIsSeeking(true)
                player.seek(newTime)
            } finally {
                setIsSeeking(false)
            }
        },
        [player],
    )
    return {
        totalTime,
        elapsedTime,
        remainingTime,
        seekToTime,
        isSeeking,
    }
}
