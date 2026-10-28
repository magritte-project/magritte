import { formatColor, type ColorFormat, type ColorValue, type OKLCH } from "chromakit-react"

import { parseColorValue } from "@/utilities/css"

function getColorSchemeSign(oklch: OKLCH) {
    return oklch.L > 0.5 ? 1 : -1
}

type ComponentColorFormat = {
    [F in ColorFormat]: ColorValue[F] extends object ? F : never
}[ColorFormat]

function updateColorValue<
    const TFormat extends ComponentColorFormat,
    const TFormatKey extends keyof ColorValue[TFormat],
>(
    colorValue: ColorValue,
    format: TFormat,
    key: TFormatKey,
    value: ColorValue[TFormat][TFormatKey],
): ColorValue {
    return {
        ...colorValue,
        [format]: { ...colorValue[format], [key]: value },
    }
}

function formatUpdatedColorValue<
    const TFormat extends ComponentColorFormat,
    const TFormatKey extends keyof ColorValue[TFormat],
>(
    colorValue: ColorValue,
    format: TFormat,
    key: TFormatKey,
    value: ColorValue[TFormat][TFormatKey],
): string {
    return formatColor(updateColorValue(colorValue, format, key, value), format)
}

export function nextColors(primary: string) {
    const parsedPrimary = parseColorValue(primary)
    if (parsedPrimary === null) {
        return { secondary: primary, tertiary: primary, quaternary: primary }
    }
    const primaryOklch = parsedPrimary.oklch
    const sign = getColorSchemeSign(primaryOklch)
    // Cap steps so three of them never pass black (dark colors) or white (light colors)
    const headroom = sign > 0 ? 1 - primaryOklch.L : primaryOklch.L
    const distanceL = Math.min(0.1, headroom / 4) * sign
    const secondary = formatUpdatedColorValue(
        parsedPrimary,
        "oklch",
        "L",
        primaryOklch.L + distanceL * 1,
    )
    const tertiary = formatUpdatedColorValue(
        parsedPrimary,
        "oklch",
        "L",
        primaryOklch.L + distanceL * 2,
    )
    const quaternary = formatUpdatedColorValue(
        parsedPrimary,
        "oklch",
        "L",
        primaryOklch.L + distanceL * 3,
    )
    return { secondary, tertiary, quaternary }
}
