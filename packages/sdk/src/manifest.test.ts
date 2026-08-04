import { beforeEach, describe, expect, it, vi } from "vitest"

import { getAbsoluteOrigin, getExtensionAllow, getExtensionSrc, isSameOrigin } from "./manifest"

describe("manifest", () => {
    describe("#getAbsoluteOrigin", () => {
        beforeEach(() => {
            vi.stubGlobal("location", { href: "http://localhost:8080" })
        })

        it("should return the correct value for absolute URLs", () => {
            expect(getAbsoluteOrigin("https://example.com/a/b/123")).toStrictEqual(
                "https://example.com",
            )
            expect(getAbsoluteOrigin("http://geocities.com/~superkitty/about.html")).toStrictEqual(
                "http://geocities.com",
            )
            expect(getAbsoluteOrigin("http://localhost:8080/here")).toStrictEqual(
                "http://localhost:8080",
            )
        })

        it("should resolve relative URLs to window location", () => {
            expect(getAbsoluteOrigin("/a/b/123")).toStrictEqual("http://localhost:8080")
            expect(getAbsoluteOrigin("./a/b/123")).toStrictEqual("http://localhost:8080")
        })
    })

    describe("#isSameOrigin", () => {
        beforeEach(() => {
            vi.stubGlobal("location", { href: "http://localhost:8080" })
        })

        it("should accept different paths, queries, and hashes", () => {
            expect(isSameOrigin("https://example.com/a", "https://example.com/b")).toBe(true)
            expect(isSameOrigin("https://example.com/?x=12", "https://example.com/?x=43&y=3")).toBe(
                true,
            )
            expect(isSameOrigin("https://example.com/", "https://example.com/#about")).toBe(true)
        })

        it("should handle relative URLs", () => {
            expect(isSameOrigin("http://localhost:8080/", "/")).toBe(true)
        })

        it("should reject host mismatches", () => {
            expect(isSameOrigin("https://sub.example.com/", "https://example.com/")).toBe(false)
        })

        it("should reject protocol mismatches", () => {
            expect(isSameOrigin("http://example.com/", "https://example.com/")).toBe(false)
        })

        it("should reject port mismatches", () => {
            expect(isSameOrigin("http://localhost:8080/", "http://localhost:8090/")).toBe(false)
        })
    })

    describe("#getExtensionSrc", () => {
        it("should include host and manifest id", () => {
            const src = getExtensionSrc(
                {
                    name: "Test",
                    id: "magritte.test",
                    version: "0.0.0",
                    url: "http://localhost:8090",
                },
                { hostOrigin: "http://localhost:8080" },
            )
            expect(src).toContain("e=magritte.test")
            expect(src).toContain("h=http%3A%2F%2Flocalhost%3A8080")
        })

        it("should reject same origin as host", () => {
            expect(() =>
                getExtensionSrc(
                    {
                        name: "Test",
                        id: "magritte.test",
                        version: "0.0.0",
                        url: "http://localhost:8080/extension.html",
                    },
                    { hostOrigin: "http://localhost:8080" },
                ),
            ).toThrow()
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
