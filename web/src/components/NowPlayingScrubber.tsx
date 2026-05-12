import Slider from "rc-slider"

import "rc-slider/assets/index.css"
import { useCallback } from "react"

import usePlaybackState from "@/hooks/playbackStateHook"
import usePlaybackTime from "@/hooks/playbackTimeHook"

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
        <Slider
            value={elapsedTime ?? 0}
            max={totalTime ?? 0}
            step={1}
            onChange={handleChange}
            disabled={isSeeking || playbackState === "stopped"}
            classNames={{
                track: "bg-orange-900!",
                handle: "bg-orange-400! border-1! border-red-500! opacity-100!",
                rail: "bg-gray-800!",
            }}
        />
    )
}
