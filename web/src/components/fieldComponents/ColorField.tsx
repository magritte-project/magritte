import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { ColorPicker, formatColor, type ColorPickerProps, type ColorValue } from "chromakit-react"

import "chromakit-react/chromakit.css"
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
            field.handleChange(formatColor(next, "oklch"))
        },
        [field],
    )

    return (
        <Popover className="relative">
            <ThemedSubtleButton buttonComponent={PopoverButton} className="relative group">
                <div className="flex items-center gap-md">
                    <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: field.state.value ?? undefined }}
                        aria-label={`Color: ${field.state.value ?? "none"}`}
                    />
                    <span>{label}</span>
                    <CaretDownIcon />
                </div>
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
