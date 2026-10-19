import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { ColorPicker, formatColor, type ColorPickerProps, type ColorValue } from "chromakit-react"

import "chromakit-react/chromakit.css"
import classNames from "classnames"
import { useCallback } from "react"

import { useFieldContext } from "@/contexts/formContext"

export type ColorFieldProps = Omit<ColorPickerProps, "value" | "onChange">

export default function ColorField({ ...props }: ColorFieldProps) {
    const field = useFieldContext<string | null | undefined>()

    const handleChange = useCallback(
        (next: ColorValue) => {
            field.handleChange(formatColor(next, "oklch"))
        },
        [field],
    )

    return (
        <Popover className="relative">
            <PopoverButton
                className={classNames(
                    "px-lg py-md flex items-center gap-md text-start",
                    "rounded-input bg-secondary active:bg-secondary-active data-open:bg-secondary-active",
                    "font-bold disabled:opacity-disabled drop-shadow-xs",
                    "w-full relative group",
                )}
            >
                <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: field.state.value ?? undefined }}
                    aria-hidden
                />
                <span className="flex-1">{field.state.value ?? "none"}</span>
                <CaretDownIcon />
            </PopoverButton>
            <PopoverPanel anchor="bottom start" className="shadow-sm">
                <ColorPicker
                    showAlpha={false}
                    value={field.state.value ?? undefined}
                    onChange={handleChange}
                    {...props}
                />
            </PopoverPanel>
        </Popover>
    )
}
