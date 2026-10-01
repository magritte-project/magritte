import type { SelectFieldOption } from "@/components/fieldComponents/SelectField"

/** The available sans serif typefaces */
export const SANS_SERIF: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Sans", value: '"Bitstream Vera Sans", sans-serif' },
    { label: "Comfortaa", value: '"Comfortaa", sans-serif' },
    { label: "FiraGO", value: '"FiraGO", sans-serif' },
    { label: "IBM Plex Sans", value: '"IBM Plex Sans", sans-serif' },
    { label: "Inter", value: '"Inter", sans-serif' },
    { label: "System", value: "system-ui" },
]

/** The available serif typefaces */
export const SERIF: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Serif", value: '"Bitstream Vera Serif", serif' },
]

export const DISPLAY: readonly SelectFieldOption<string>[] = [...SANS_SERIF, ...SERIF]

/** The available monospace typefaces */
export const MONOSPACE: readonly SelectFieldOption<string>[] = [
    { label: "Bitstream Vera Sans Mono", value: '"Bitstream Vera Sans Mono", monospace' },
    { label: "Fira Mono", value: '"Fira Mono", monospace' },
]
