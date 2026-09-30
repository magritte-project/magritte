export interface Typeface {
    /** A friendly label for the font */
    readonly label: string

    /** The font family */
    readonly fontFamily: string
}

/** The available sans serif typefaces */
export const SANS_SERIF: readonly Typeface[] = [
    { label: "Bitstream Vera Sans", fontFamily: "Bitstream Vera Sans" },
    { label: "Comfortaa", fontFamily: "Comfortaa" },
    { label: "FiraGO", fontFamily: "FiraGO" },
    { label: "IBM Plex Sans", fontFamily: "IBM Plex Sans" },
]

/** The available serif typefaces */
export const SERIF: readonly Typeface[] = [
    { label: "Bitstream Vera Serif", fontFamily: "Bitstream Vera Serif" },
]

/** The available monospace typefaces */
export const MONOSPACE: readonly Typeface[] = [
    { label: "Fira Mono", fontFamily: "Fira Mono" },
    { label: "Bitstream Vera Sans Mono", fontFamily: "Bitstream Vera Sans Mono" },
]
