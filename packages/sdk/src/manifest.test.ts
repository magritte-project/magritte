import { describe, expect, it } from "vitest"

import { getExtensionAllow, getExtensionSrc } from "./manifest"

describe("manifest", () => {
    describe("#getExtensionSrc", () => {
        it("should include host and manifest id", () => {
            const src = getExtensionSrc(
                {
                    name: "Test",
                    id: "magritte.test",
                    version: "0.0.0",
                    url: "about:blank",
                },
                { hostOrigin: "about:blank" },
            )
            expect(src).toContain("e=magritte.test")
            expect(src).toContain("h=about%3Ablank")
        })
    })

    describe("#getExtensionAllow", () => {
        it("should include nothing unless otherwise required", () => {
            expect(
                getExtensionAllow({
                    name: "Test",
                    id: "magritte.test",
                    version: "0.0.0",
                    url: "about:blank",
                }),
            ).toStrictEqual("")
        })

        it("should include encrypted media and autoplay when source schemes is specified", () => {
            const allow = getExtensionAllow({
                name: "Test",
                id: "magritte.test",
                version: "0.0.0",
                url: "about:blank",
                sourceSchemes: ["magic"],
            })
            expect(allow).toContain("encrypted-media")
            expect(allow).toContain("autoplay")
        })
    })
})
