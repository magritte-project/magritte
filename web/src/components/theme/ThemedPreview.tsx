import { Field, Label, RadioGroup } from "@headlessui/react"
import { useEffect, useRef } from "react"

import ThemedButton from "@/components/theme/ThemedButton"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedInput from "@/components/theme/ThemedInput"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedRadio from "@/components/theme/ThemedRadio"
import ThemedSearchInput from "@/components/theme/ThemedSearchInput"
import ThemedSelect from "@/components/theme/ThemedSelect"
import ThemedSlider from "@/components/theme/ThemedSlider"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { applyTheme } from "@/themes/apply"
import type { Theme } from "@/themes/base"
import { defaultTheme } from "@/themes/default"

export interface ThemedPreviewProps {
    readonly theme: Theme
    readonly fallback?: Theme
}

export default function ThemedPreview({ theme, fallback = defaultTheme }: ThemedPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!containerRef.current) {
            return
        }
        applyTheme({
            element: containerRef.current,
            theme,
            fallback,
        })
    }, [theme, fallback])

    return (
        <div
            ref={containerRef}
            className="flex flex-col gap-lg p-lg"
            style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
                colorScheme: "var(--default-color-scheme)",
                fontFamily: "var(--default-font-family)",
            }}
        >
            <div className="shadow-lg shadow-high-contrast bg-primary text-on-primary active:bg-primary-active p-md">
                Primary
            </div>
            <div className="shadow-lg shadow-high-contrast bg-secondary text-on-secondary active:bg-secondary-active p-md">
                Secondary
            </div>
            <div className="shadow-lg shadow-high-contrast bg-tertiary text-on-tertiary active:bg-tertiary-active p-md">
                Tertiary
            </div>
            <div className="shadow-lg shadow-high-contrast bg-quaternary text-on-quaternary active:bg-quaternary-active p-md">
                Quaternary
            </div>
            <ThemedButton type="button">Button</ThemedButton>
            <ThemedSubtleButton type="button">Subtle Button</ThemedSubtleButton>
            <ThemedLink to=".">Link</ThemedLink>
            <ThemedInput placeholder="Input" />
            <ThemedSearchInput placeholder="Search Input" />
            <Field className="flex items-center gap-md">
                <ThemedCheckbox className="peer" id="ThemedPreview-checkbox" />
                <Label
                    htmlFor="ThemedPreview-checkbox"
                    className="text-sm font-semibold peer-aria-disabled:opacity-disabled"
                >
                    Checkbox
                </Label>
            </Field>
            <RadioGroup className="flex items-start flex-wrap gap-lg" defaultValue={0}>
                <ThemedRadio className="peer" id="ThemedPreview-radio-0" value={0} />
                <Label
                    htmlFor="ThemedPreview-radio-0"
                    className="text-sm font-semibold peer-aria-disabled:opacity-disabled"
                >
                    Radio 0
                </Label>
                <ThemedRadio className="peer" id="ThemedPreview-radio-0" value={1} />
                <Label
                    htmlFor="ThemedPreview-radio-1"
                    className="text-sm font-semibold peer-aria-disabled:opacity-disabled"
                >
                    Radio 1
                </Label>
            </RadioGroup>
            <ThemedSelect defaultValue="0">
                <option value="0">First</option>
                <option value="1">Second</option>
            </ThemedSelect>
            <ThemedSlider min={0} max={1} step={0.1} defaultValue={0.5} />
            <pre style={{ fontFamily: "var(--default-mono-font-family)" }}>Monospace</pre>
        </div>
    )
}
