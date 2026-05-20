import { describe, expect, it } from "vitest"

import { Local } from "./local"

describe("Local", () => {
    describe("#constructor", () => {
        it("should return its initial value", () => {
            const $subject = new Local(42)
            expect($subject.value).toBe(42)
        })
    })

    describe("#withValue", () => {
        it("should set a value for the duration of an operation", () => {
            const $subject = new Local(42)
            $subject.withValue(43, () => {
                expect($subject.value).toBe(43)
            })
            expect($subject.value).toBe(42)
        })

        it("should nest operations", () => {
            const $subject = new Local(42)
            $subject.withValue(43, () => {
                expect($subject.value).toBe(43)
                $subject.withValue(44, () => {
                    expect($subject.value).toBe(44)
                })
                expect($subject.value).toBe(43)
            })
            expect($subject.value).toBe(42)
        })

        it("should restore the previous value if the operation throws", () => {
            const $subject = new Local(42)
            expect(() =>
                $subject.withValue(43, () => {
                    throw new Error("test")
                }),
            ).toThrow()
            expect($subject.value).toBe(42)
        })
    })

    describe("#withValueAsync", () => {
        it("should set a value for the duration of an async operation", async () => {
            const $subject = new Local(42)
            await $subject.withValueAsync(43, async () => {
                expect($subject.value).toBe(43)
            })
            expect($subject.value).toBe(42)
        })

        it("should nest operations", async () => {
            const $subject = new Local(42)
            await $subject.withValueAsync(43, async () => {
                expect($subject.value).toBe(43)
                await $subject.withValueAsync(44, async () => {
                    expect($subject.value).toBe(44)
                })
                expect($subject.value).toBe(43)
            })
            expect($subject.value).toBe(42)
        })

        it("should restore the previous value if the operation throws", async () => {
            const $subject = new Local(42)
            await expect(
                $subject.withValueAsync(43, async () => {
                    throw new Error("test")
                }),
            ).rejects.toThrow()
            expect($subject.value).toBe(42)
        })
    })
})
