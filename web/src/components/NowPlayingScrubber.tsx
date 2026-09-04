import Slider from "rc-slider"

import "rc-slider/assets/index.css"
import { useCallback } from "react"

import usePlaybackState from "@/hooks/playbackStateHook"
import usePlaybackTime from "@/hooks/playbackTimeHook"
import { formatDuration } from "@/utilities/duration"

export default function NowPlayingScrubber() {
    const { elapsedTime, totalTime, seekToTime, isSeeking } = usePlaybackTime()
    const playbackState = usePlaybackState()
    const handleChange = useCallback(
        async (newValue: number | number[]) => {
            await seekToTime(newValue as number)
        },
        [seekToTime],
    )
    return (
        <div className="flex items-center gap-between">
            <Slider
                value={elapsedTime ?? 0}
                max={totalTime ?? 0}
                step={1}
                onChange={handleChange}
                disabled={isSeeking || playbackState === "stopped"}
                className="bg-transparent!"
                styles={{
                    track: {
                        backgroundColor: "var(--color-key)",
                    },
                    rail: {
                        backgroundColor: "var(--color-quaternary)",
                    },
                    handle: {
                        border: "1px solid var(--color-key)",
                        backgroundColor: "var(--color-key-subtle)",
                        opacity: 1,
                    },
                }}
            />
            <div className="text-xs font-medium">
                {elapsedTime !== null ? formatDuration(elapsedTime) : "--:--"}
            </div>
        </div>
    )
}
