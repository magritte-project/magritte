import { type ColorValue, parseColor, rgbaToColorValue } from "chromakit-react"

import { camelCaseToKebabCase } from "@/utilities/strings"

export function getPropertyName(name: string, ...prefixes: string[]): string {
    return `--${[...prefixes, name].map(camelCaseToKebabCase).join("-")}`
}

export function parseColorValue(color: string): ColorValue | null {
    const rgba = parseColor(color)
    if (!rgba) {
        return null
    }
    return rgbaToColorValue(rgba)
}
