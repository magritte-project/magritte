import "rc-slider/assets/index.css"
import { useCallback } from "react"

import ThemedSlider from "@/components/theme/ThemedSlider"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlaybackTime from "@/hooks/playbackTimeHook"
import { formatDuration } from "@/utilities/duration"

export default function PlayerScrubber() {
    const { elapsedTime, totalTime, seekToTime, isSeeking } = usePlaybackTime()
    const { playbackState } = usePlaybackState()
    const handleChange = useCallback(
        async (newValue: number | number[]) => {
            await seekToTime(newValue as number)
        },
        [seekToTime],
    )
    return (
        <div className="flex items-center gap-lg">
            <ThemedSlider
                value={elapsedTime ?? 0}
                max={totalTime ?? 0}
                step={1}
                onChange={handleChange}
                disabled={isSeeking || playbackState === "stopped"}
            />
            <div className="text-xs font-medium">
                {elapsedTime !== null ? formatDuration(elapsedTime) : "--:--"}
            </div>
        </div>
    )
}
