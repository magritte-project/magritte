import { describe, expect, it } from "vitest"

import { nextLightnessNotch } from "./calculations"

describe("calculations", () => {
    describe("#nextLightness", () => {
        describe("#lightColors", () => {
            it("should constrain too large input at brightest lightness notch", () => {
                expect(nextLightnessNotch(1.1)).toBe(1.0)
            })

            it("should return the clamped lightness when darker than input", () => {
                expect(nextLightnessNotch(0.6)).toBe(0.554)
            })

            it("should return the next lightness notch when input matches exactly", () => {
                expect(nextLightnessNotch(0.704)).toBe(0.554)
            })

            it("should notch darker from the brightest lightness notch", () => {
                expect(nextLightnessNotch(1.0)).toBe(0.984)
            })
        })

        describe("#darkColors", () => {
            it("should constrain too small input at darkest lightness notch", () => {
                expect(nextLightnessNotch(-0.1)).toBe(0.0)
            })

            it("should return the clamped lightness when brighter than input", () => {
                expect(nextLightnessNotch(0.4)).toBe(0.446)
            })

            it("should return the next lightness notch when input matches exactly", () => {
                expect(nextLightnessNotch(0.372)).toBe(0.446)
            })

            it("should notch brighter from the darkest lightness notch", () => {
                expect(nextLightnessNotch(0.0)).toBe(0.129)
            })
        })
    })
})
