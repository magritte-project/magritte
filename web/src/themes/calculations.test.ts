import { describe, expect, it } from "vitest"

import { parseColorValue } from "@/utilities/css"

import { nextColors } from "./calculations"

/** Reads the components of an `oklch(L% C H)` string without converting it through another color space */
function oklchComponents(color: string) {
    const match = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(color)
    if (match === null) {
        throw new Error(`Not an oklch color: ${color}`)
    }
    return { L: Number(match[1]) / 100, C: Number(match[2]), h: Number(match[3]) }
}

function primaryOklch(color: string) {
    const parsed = parseColorValue(color)
    if (parsed === null) {
        throw new Error(`Not a color: ${color}`)
    }
    return parsed.oklch
}

function lightnesses(colors: ReturnType<typeof nextColors>) {
    return [colors.secondary, colors.tertiary, colors.quaternary].map(
        (color) => oklchComponents(color).L,
    )
}

describe("calculations", () => {
    describe("#nextColors", () => {
        it("should return the input for every color when it can't be parsed", () => {
            expect(nextColors("not a color")).toStrictEqual({
                secondary: "not a color",
                tertiary: "not a color",
                quaternary: "not a color",
            })
        })

        it("should format every color as oklch", () => {
            const colors = nextColors("#336699")
            for (const color of [colors.secondary, colors.tertiary, colors.quaternary]) {
                expect(color).toMatch(/^oklch\(/)
            }
        })

        it("should keep the chroma and hue of the primary color", () => {
            const primary = primaryOklch("#336699")
            const colors = nextColors("#336699")
            for (const color of [colors.secondary, colors.tertiary, colors.quaternary]) {
                const { C, h } = oklchComponents(color)
                expect(C).toBeCloseTo(primary.C, 2)
                expect(h).toBeCloseTo(primary.h, 0)
            }
        })

        describe("#darkColors", () => {
            it("should step darker by 0.1 lightness", () => {
                const { L } = primaryOklch("#336699")
                const [secondary, tertiary, quaternary] = lightnesses(nextColors("#336699"))
                expect(secondary).toBeCloseTo(L - 0.1, 2)
                expect(tertiary).toBeCloseTo(L - 0.2, 2)
                expect(quaternary).toBeCloseTo(L - 0.3, 2)
            })

            it("should step by a quarter of the lightness when 0.1 steps would reach black", () => {
                const { L } = primaryOklch("oklch(20% 0.05 240)")
                const [secondary, tertiary, quaternary] = lightnesses(
                    nextColors("oklch(20% 0.05 240)"),
                )
                expect(secondary).toBeCloseTo(L * 0.75, 2)
                expect(tertiary).toBeCloseTo(L * 0.5, 2)
                expect(quaternary).toBeCloseTo(L * 0.25, 2)
                expect(quaternary).toBeGreaterThan(0)
            })
        })

        describe("#lightColors", () => {
            it("should step lighter by 0.1 lightness", () => {
                const { L } = primaryOklch("oklch(55% 0.1 240)")
                const [secondary, tertiary, quaternary] = lightnesses(
                    nextColors("oklch(55% 0.1 240)"),
                )
                expect(secondary).toBeCloseTo(L + 0.1, 2)
                expect(tertiary).toBeCloseTo(L + 0.2, 2)
                expect(quaternary).toBeCloseTo(L + 0.3, 2)
            })

            it("should never step past full lightness", () => {
                for (const primary of ["oklch(80% 0.1 240)", "oklch(95% 0.05 240)", "#ffffff"]) {
                    for (const L of lightnesses(nextColors(primary))) {
                        expect(L).toBeLessThanOrEqual(1)
                    }
                }
            })
        })
    })
})
