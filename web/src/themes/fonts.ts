import type { SelectFieldOption } from "@/components/fieldComponents/SelectField"

/** The available sans serif fonts */
export const SANS_SERIF_FONTS: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Sans", value: '"Bitstream Vera Sans", sans-serif' },
    { label: "Comfortaa", value: '"Comfortaa", sans-serif' },
    { label: "FiraGO", value: '"FiraGO", sans-serif' },
    { label: "IBM Plex Sans", value: '"IBM Plex Sans", sans-serif' },
    { label: "Inter", value: '"Inter", sans-serif' },
    { label: "System", value: "system-ui" },
]

/** The available serif fonts */
export const SERIF_FONTS: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Serif", value: '"Bitstream Vera Serif", serif' },
]

export const DISPLAY_FONTS: readonly SelectFieldOption<string>[] = [
    ...SANS_SERIF_FONTS,
    ...SERIF_FONTS,
]

/** The available monospace fonts */
export const MONOSPACE_FONTS: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Sans Mono", value: '"Bitstream Vera Sans Mono", monospace' },
    { label: "Fira Mono", value: '"Fira Mono", monospace' },
]
