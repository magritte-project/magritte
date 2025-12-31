import usePlayer from "@/hooks/playerHook"
import type { PlaybackEngineState } from "@/playback/engine"
import { useCallback, useEffect, useState } from "react"

export interface UsePlayerTimeResult {
    readonly elapsedTime: number | null
    readonly totalTime: number | null
    readonly remainingTime: number | null
    readonly seekToTime: (newTime: number) => Promise<void>
    readonly isSeeking: boolean
    readonly playbackState: PlaybackEngineState
}

export default function usePlayerTime(): UsePlayerTimeResult {
    const player = usePlayer()
    const [elapsedTime, setElapsedTime] = useState(player.currentTime)
    const [isSeeking, setIsSeeking] = useState(false)
    useEffect(() => {
        if (isSeeking || player.playbackState !== "playing") {
            return
        }
        const interval = setInterval(() => {
            setElapsedTime(player.currentTime)
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [player, isSeeking, player.playbackState])
    const totalTime = player.totalTime
    const remainingTime =
        totalTime !== null && elapsedTime !== null
            ? totalTime - elapsedTime
            : null
    const seekToTime = useCallback(
        async (newTime: number) => {
            try {
                setIsSeeking(true)
                player.seek(newTime)
                setIsSeeking(false)
            } catch (error) {
                setIsSeeking(false)
                throw error
            }
        },
        [player],
    )
    const playbackState = player.playbackState
    return {
        totalTime,
        elapsedTime,
        remainingTime,
        seekToTime,
        isSeeking,
        playbackState,
    }
}
