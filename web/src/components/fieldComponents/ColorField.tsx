import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { CaretDownIcon } from "@phosphor-icons/react"

import "chromakit-react/chromakit.css"
import { ColorPicker, type ColorPickerProps, type ColorValue } from "chromakit-react"
import { useCallback, type ReactNode } from "react"

import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { useFieldContext } from "@/contexts/formContext"

export interface ColorFieldProps extends Omit<ColorPickerProps, "value" | "onChange"> {
    readonly label: ReactNode
}

export default function ColorField({ label, ...rest }: ColorFieldProps) {
    const field = useFieldContext<string | null | undefined>()

    const handleChange = useCallback(
        (next: ColorValue) => {
            const oklch = next.oklch
            field.handleChange(`oklch(${(oklch.L * 100).toFixed(2)}% ${oklch.C} ${oklch.h})`)
        },
        [field],
    )

    return (
        <Popover className="relative">
            <ThemedSubtleButton
                buttonComponent={PopoverButton}
                className="flex items-center gap-2 relative group"
            >
                <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: field.state.value ?? undefined }}
                    aria-label={`Color: ${field.state.value ?? "none"}`}
                />{" "}
                {label} <CaretDownIcon />
            </ThemedSubtleButton>
            <PopoverPanel anchor="bottom start" className="shadow-sm">
                <ColorPicker
                    showAlpha={false}
                    value={field.state.value ?? undefined}
                    onChange={handleChange}
                    {...rest}
                />
            </PopoverPanel>
        </Popover>
    )
}
