import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { SpeakerLowIcon, SpeakerNoneIcon, SpeakerHighIcon } from "@phosphor-icons/react"
import Slider from "rc-slider"
import { useCallback } from "react"

import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useVolume from "@/hooks/volumeHook"

export default function VolumeButton() {
    const [volume, setVolume] = useVolume()
    const handleChange = useCallback(
        async (newValue: number | number[]) => {
            setVolume(newValue as number)
        },
        [setVolume],
    )
    return (
        <Popover className="relative">
            <ThemedSubtleButton buttonComponent={PopoverButton} className="flex items-center gap-1">
                {volume === 0.0 ? (
                    <SpeakerNoneIcon />
                ) : volume < 0.5 ? (
                    <SpeakerLowIcon />
                ) : (
                    <SpeakerHighIcon />
                )}
            </ThemedSubtleButton>
            <PopoverPanel
                anchor="bottom"
                className="bg-white rounded-md shadow-sm p-4 h-48 flex flex-col items-center gap-4"
            >
                <SpeakerHighIcon size="1.2rem" weight="bold" />
                <Slider
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleChange}
                    vertical={true}
                />
                <SpeakerNoneIcon size="1.2rem" weight="bold" />
            </PopoverPanel>
        </Popover>
    )
}
