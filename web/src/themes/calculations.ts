import { formatColor, type ColorValue } from "chromakit-react"

import { parseColorValue } from "@/utilities/css"

/** The lightness notches used to ramp values in the OKLCH colorspace up and down */
const LIGHTNESS_NOTCHES: readonly number[] = [
    0.0, 0.129, 0.208, 0.279, 0.372, 0.446, 0.554, 0.704, 0.869, 0.929, 0.968, 0.984, 1.0,
]

/** The number of lightness notches defined */
const NUMBER_OF_LIGHTNESS_NOTCHES = LIGHTNESS_NOTCHES.length

/**
 * Calculate the next lightness notch for a given color.
 *
 * @param L A lightness value from a color in the OKLCH colorspace.
 * @returns The next lightness notch.
 */
export function nextLightnessNotch(L: number): number {
    if (L < 0.0) {
        return LIGHTNESS_NOTCHES[0]
    } else if (L > 1.0) {
        return LIGHTNESS_NOTCHES[NUMBER_OF_LIGHTNESS_NOTCHES - 1]
    }

    if (L > 50.0) {
        let nearestNotchIndex = NUMBER_OF_LIGHTNESS_NOTCHES - 1
        let nearestNotchL = 0
        while (nearestNotchIndex >= 0) {
            nearestNotchL = LIGHTNESS_NOTCHES[nearestNotchIndex]
            if (nearestNotchL <= L) {
                break
            }
            nearestNotchIndex--
        }
        if (nearestNotchL < L) {
            return nearestNotchL
        }
        const previousNotchIndex = Math.max(nearestNotchIndex - 1, 0)
        return LIGHTNESS_NOTCHES[previousNotchIndex]
    } else {
        let nearestNotchIndex = 0
        let nearestNotchL = 0
        while (nearestNotchIndex < NUMBER_OF_LIGHTNESS_NOTCHES) {
            nearestNotchL = LIGHTNESS_NOTCHES[nearestNotchIndex]
            if (nearestNotchL >= L) {
                break
            }
            nearestNotchIndex++
        }
        if (nearestNotchL > L) {
            return nearestNotchL
        }
        const nextNotchIndex = Math.min(nearestNotchIndex + 1, NUMBER_OF_LIGHTNESS_NOTCHES - 1)
        return LIGHTNESS_NOTCHES[nextNotchIndex]
    }
}

export function nextColor(color: string): string {
    const parsedColor = parseColorValue(color)
    if (parsedColor === null) {
        return color
    }
    console.log(color, parsedColor)
    const newColor: ColorValue = {
        ...parsedColor,
        oklch: { ...parsedColor.oklch, L: nextLightnessNotch(parsedColor.oklch.L) },
    }
    return formatColor(newColor, "oklch")
}

export function nextColors(primary: string) {
    const secondary = nextColor(primary)
    const tertiary = nextColor(secondary)
    const quaternary = nextColor(tertiary)
    console.log(primary, secondary, tertiary, quaternary)
    return { secondary, tertiary, quaternary }
}
