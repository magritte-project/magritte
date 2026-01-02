import { describe, expect, it } from "vitest"
import { getErrorMessage } from "./errors"

describe("errors", () => {
    describe("#getErrorMessage", () => {
        it("should return an error's message", () => {
            expect(
                getErrorMessage(new Error("An unexpected error occurred")),
            ).toStrictEqual("An unexpected error occurred")
        })
        it("should handle arbitrary values", () => {
            expect(
                getErrorMessage("An unexpected error occurred"),
            ).toStrictEqual("An unexpected error occurred")
        })
    })
})
