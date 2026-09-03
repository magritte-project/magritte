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
            <ThemedSubtleButton buttonComponent={PopoverButton} title="Volume">
                {volume === 0.0 ? (
                    <SpeakerNoneIcon size="1.2rem" />
                ) : volume < 0.5 ? (
                    <SpeakerLowIcon size="1.2rem" />
                ) : (
                    <SpeakerHighIcon size="1.2rem" />
                )}
            </ThemedSubtleButton>
            <PopoverPanel
                anchor="bottom"
                className="bg-primary rounded-md shadow-sm p-outside h-48 flex flex-col items-center gap-between"
            >
                <SpeakerHighIcon size="1.2rem" weight="bold" />
                <Slider
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleChange}
                    vertical={true}
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
                <SpeakerNoneIcon size="1.2rem" weight="bold" />
            </PopoverPanel>
        </Popover>
    )
}
