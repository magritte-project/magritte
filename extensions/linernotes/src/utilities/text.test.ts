import { describe, expect, it } from "vitest"

import {
    compareTitles,
    hasEditionSuffix,
    normalizeForMatch,
    stripEditionSuffixesForSearch,
} from "@/utilities/text"

describe("normalizeForMatch", () => {
    it("ignores case, accents and punctuation", () => {
        expect(normalizeForMatch("Björk")).toBe("bjork")
        expect(normalizeForMatch("Don't Stop Me Now!")).toBe("dont stop me now")
        expect(normalizeForMatch("  Ægis   ")).toBe("ægis".normalize("NFD").replace(/[̀-ͯ]/g, ""))
    })

    it("treats ampersands as and", () => {
        expect(normalizeForMatch("Simon & Garfunkel")).toBe("simon and garfunkel")
    })

    it("strips edition suffixes", () => {
        expect(normalizeForMatch("Nevermind (Remastered 2011)")).toBe("nevermind")
        expect(normalizeForMatch("Nevermind (Deluxe Edition)")).toBe("nevermind")
        expect(normalizeForMatch("Come as You Are - 2011 Remaster")).toBe("come as you are")
        expect(normalizeForMatch("Dummy [Explicit]")).toBe("dummy")
        expect(normalizeForMatch("Glory Box (Deluxe Edition) [Remastered]")).toBe("glory box")
    })

    it("keeps titles which are only a bracketed phrase", () => {
        expect(normalizeForMatch("(Remastered)")).toBe("remastered")
    })

    it("keeps a parenthetical which is part of the title", () => {
        expect(normalizeForMatch("Nirvana (band)")).toBe("nirvana band")
    })

    it("is empty for missing values", () => {
        expect(normalizeForMatch(null)).toBe("")
        expect(normalizeForMatch(undefined)).toBe("")
    })
})

describe("stripEditionSuffixesForSearch", () => {
    it("drops edition and featuring suffixes but keeps the casing", () => {
        expect(stripEditionSuffixesForSearch("Come Together - Remastered 2009")).toBe(
            "Come Together",
        )
        expect(stripEditionSuffixesForSearch("Abbey Road (Remastered)")).toBe("Abbey Road")
        expect(stripEditionSuffixesForSearch("Empire State of Mind (feat. Alicia Keys)")).toBe(
            "Empire State of Mind",
        )
        expect(stripEditionSuffixesForSearch("Nirvana (band)")).toBe("Nirvana (band)")
        expect(stripEditionSuffixesForSearch("(Remastered)")).toBe("(Remastered)")
    })
})

describe("hasEditionSuffix", () => {
    it("spots editions named in the title", () => {
        expect(hasEditionSuffix("Nevermind (30th Anniversary Super Deluxe)")).toBe(true)
        expect(hasEditionSuffix("Nevermind")).toBe(false)
        expect(hasEditionSuffix("Nirvana (band)")).toBe(false)
        expect(hasEditionSuffix(null)).toBe(false)
    })
})

describe("compareTitles", () => {
    it("scores an exact match highest", () => {
        expect(compareTitles("Nevermind", "NEVERMIND (2011 Remaster)")).toBe(2)
    })

    it("scores a containing match in the middle", () => {
        expect(compareTitles("Nevermind", "Nevermind: The Singles")).toBe(1)
    })

    it("scores unrelated or missing titles zero", () => {
        expect(compareTitles("Nevermind", "In Utero")).toBe(0)
        expect(compareTitles("Nevermind", null)).toBe(0)
    })
})
