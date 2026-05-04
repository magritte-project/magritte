import { useCallback } from "react"

import useNowPlaying from "@/hooks/nowPlayingHook"
import usePlaybackTime from "@/hooks/playbackTimeHook"

export default function Scrubber() {
    const { state } = useNowPlaying()
    const { elapsedTime, totalTime, seekToTime, isSeeking } = usePlaybackTime()
    const handleChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            await seekToTime(event.currentTarget.valueAsNumber as number)
        },
        [seekToTime],
    )
    return (
        <input
            type="range"
            value={elapsedTime ?? 0}
            max={totalTime ?? 0}
            step={1}
            onChange={handleChange}
            disabled={isSeeking || state === "stopped"}
        />
    )
}
