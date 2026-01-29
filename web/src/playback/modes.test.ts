import { describe, expect, it } from "vitest"

import { PlaybackModes } from "./modes"

describe("PlaybackModes", () => {
    it("should return a copy from withRepeat", () => {
        const original = PlaybackModes.default

        const repeatCopy = original.withRepeat("all")
        expect(repeatCopy).not.toBe(original)
        expect(repeatCopy.repeat).toStrictEqual("all")
    })

    it("should return a copy from withShuffle", () => {
        const original = PlaybackModes.default

        const repeatCopy = original.withShuffle("on")
        expect(repeatCopy).not.toBe(original)
        expect(repeatCopy.shuffle).toStrictEqual("on")
    })
})
