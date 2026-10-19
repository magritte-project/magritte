import { describe, expect, it } from "vitest"

import { getErrorMessage, getErrorName } from "./errors"

describe("errors", () => {
    describe("#getErrorName", () => {
        it("should return an error's name", () => {
            expect(getErrorName(new Error())).toStrictEqual("Error")
            expect(getErrorName(new RangeError())).toStrictEqual("RangeError")
        })

        it("should handle arbitrary values", () => {
            expect(getErrorName("An unexpected error occurred")).toStrictEqual("UnknownError")
        })
    })

    describe("#getErrorMessage", () => {
        it("should return an error's message", () => {
            expect(getErrorMessage(new Error("An unexpected error occurred"))).toStrictEqual(
                "An unexpected error occurred",
            )
        })
        it("should handle arbitrary values", () => {
            expect(getErrorMessage("An unexpected error occurred")).toStrictEqual(
                "An unexpected error occurred",
            )
        })
    })
})
