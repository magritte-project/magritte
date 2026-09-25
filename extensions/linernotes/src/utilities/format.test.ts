import { describe, expect, it } from "vitest"

import { formatDuration, formatYear, formatYears, joinDetails } from "@/utilities/format"

describe("joinDetails", () => {
    it("skips missing parts", () => {
        expect(joinDetails("Nirvana", null, "Nevermind", "")).toBe("Nirvana · Nevermind")
    })
})

describe("formatDuration", () => {
    it("formats minutes and seconds", () => {
        expect(formatDuration(301_000)).toBe("5:01")
    })

    it("adds hours when needed", () => {
        expect(formatDuration(3_723_000)).toBe("1:02:03")
    })
})

describe("formatYear", () => {
    it("reads the year of partial dates", () => {
        expect(formatYear("1991-09-24")).toBe("1991")
        expect(formatYear("1991")).toBe("1991")
        expect(formatYear("")).toBeUndefined()
        expect(formatYear(null)).toBeUndefined()
    })
})

describe("formatYears", () => {
    it("describes ongoing and ended spans", () => {
        expect(formatYears("1987-01", undefined, false)).toBe("1987–present")
        expect(formatYears("1987", "1994-04-05", true)).toBe("1987–1994")
        expect(formatYears("1967", "1967", true)).toBe("1967")
        expect(formatYears(undefined, undefined, false)).toBeUndefined()
    })
})
