import { parseColor, rgbaToColorValue, type OKLCH } from "chromakit-react"

const LIGHTNESS_STEPS: readonly number[] = [
    98.4, 96.8, 92.9, 86.9, 70.4, 55.4, 44.6, 37.2, 27.9, 20.8, 12.9,
]

function nearest(values: readonly number[], target: number): number | undefined {
    let closest: number | undefined
    let closestDistance = Infinity
    for (const value of values) {
        const distance = Math.abs(value - target)
        if (distance < closestDistance) {
            closest = value
            closestDistance = distance
        }
    }
    return closest
}

export function parseIntoOKLCH(color: string): OKLCH | null {
    const rgba = parseColor(color)
    if (!rgba) {
        return null
    }
    const { oklch } = rgbaToColorValue(rgba)
    return oklch
}

export function nextLightnessStep(color: OKLCH, forward: boolean): number {
    const nearestLightnessStep = nearest(LIGHTNESS_STEPS, color.L)
    if (nearestLightnessStep === undefined) {
        throw new Error()
    }

    const nearestLightnessStepIndex = LIGHTNESS_STEPS.indexOf(nearestLightnessStep)
    const nextLightnessStepIndex = nearestLightnessStepIndex + (forward ? +1 : -1)
    const nextLightnessStep = LIGHTNESS_STEPS[nextLightnessStepIndex]
    return Math.abs(nearestLightnessStep - nextLightnessStep)
}
