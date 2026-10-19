import { describe, expect, it } from "vitest"

import { defaultPlaybackModes, withNextRepeat, withNextShuffle } from "./modes"

describe("PlaybackModes", () => {
    describe("#withNextRepeat", () => {
        it("should set next repeat mode", () => {
            expect(withNextRepeat({ ...defaultPlaybackModes, repeat: "off" })).toStrictEqual({
                ...defaultPlaybackModes,
                repeat: "all",
            })
            expect(withNextRepeat({ ...defaultPlaybackModes, repeat: "all" })).toStrictEqual({
                ...defaultPlaybackModes,
                repeat: "one",
            })
            expect(withNextRepeat({ ...defaultPlaybackModes, repeat: "one" })).toStrictEqual({
                ...defaultPlaybackModes,
                repeat: "off",
            })
        })
    })

    describe("#withNextShuffle", () => {
        it("should set next shuffle mode", () => {
            expect(withNextShuffle({ ...defaultPlaybackModes, shuffle: "off" })).toStrictEqual({
                ...defaultPlaybackModes,
                shuffle: "on",
            })
            expect(withNextShuffle({ ...defaultPlaybackModes, shuffle: "on" })).toStrictEqual({
                ...defaultPlaybackModes,
                shuffle: "off",
            })
        })
    })
})
