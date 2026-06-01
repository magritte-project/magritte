import { describe, expect, it } from "vitest"

import { CountedSet } from "./countedSet"

describe("CountedSet", () => {
    it("should count duplicate items", () => {
        const subject = new CountedSet<string>()
        subject.add("1")
        subject.add("2")
        subject.add("1")
        expect(subject.count("1")).toBe(2)
        expect(subject.count("2")).toBe(1)
        expect(subject.count("3")).toBe(0)

        subject.delete("1")
        expect(subject.count("1")).toBe(1)

        subject.delete("1")
        expect(subject.count("1")).toBe(0)
    })

    it("should allow checking for item membership", () => {
        const subject = new CountedSet<string>()
        subject.add("1")
        subject.add("2")
        expect(subject.has("1")).toBe(true)
        expect(subject.has("2")).toBe(true)
        expect(subject.has("3")).toBe(false)
    })
})
