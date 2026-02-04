import { describe, expect, it } from "vitest"

import { lcg } from "./random"

describe("random", () => {
    describe("lcg", () => {
        it("should produce the same sequence of numbers for the same seed", () => {
            const seed = 12345
            const generator = lcg(seed)
            expect(generator.next().value).toBe(1406938949)
            expect(generator.next().value).toBe(178065916)
            expect(generator.next().value).toBe(1253561626)
            expect(generator.next().value).toBe(1706357852)
            expect(generator.next().value).toBe(2146154833)
        })
    })
})
