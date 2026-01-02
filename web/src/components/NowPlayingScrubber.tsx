import usePlaybackState from "@/hooks/playbackStateHook"
import usePlaybackTime from "@/hooks/playbackTimeHook"
import { useCallback } from "react"

export default function NowPlayingScrubber() {
    const {
        elapsedTime: currentTime,
        totalTime,
        seekToTime,
        isSeeking,
    } = usePlaybackTime()
    const playbackState = usePlaybackState()
    const handleChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            await seekToTime(e.currentTarget.valueAsNumber)
        },
        [seekToTime],
    )
    return (
        <input
            type="range"
            value={currentTime ?? 0}
            max={totalTime ?? 0}
            step={1}
            onChange={handleChange}
            disabled={isSeeking || playbackState === "stopped"}
        />
    )
}
