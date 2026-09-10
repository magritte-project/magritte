import { SpeakerHighIcon, SpeakerLowIcon, SpeakerNoneIcon } from "@phosphor-icons/react"
import Slider from "rc-slider"
import { useCallback } from "react"

import useVolume from "@/hooks/volumeHook"

export default function PlayerVolume() {
    const [volume, setVolume] = useVolume()
    const handleChange = useCallback(
        async (newValue: number | number[]) => {
            setVolume(newValue as number)
        },
        [setVolume],
    )
    return (
        <div className="flex items-center gap-between">
            <Slider
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleChange}
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
            {volume === 0.0 ? (
                <SpeakerNoneIcon size="1.2rem" />
            ) : volume < 0.5 ? (
                <SpeakerLowIcon size="1.2rem" />
            ) : (
                <SpeakerHighIcon size="1.2rem" />
            )}
        </div>
    )
}
