import { SpeakerHighIcon, SpeakerLowIcon, SpeakerNoneIcon } from "@phosphor-icons/react"
import { useCallback } from "react"

import ThemedSlider from "@/components/theme/ThemedSlider"
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
        <div className="flex items-center gap-lg">
            <ThemedSlider value={volume} min={0} max={1} step={0.01} onChange={handleChange} />
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
