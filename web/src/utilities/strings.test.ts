import { describe, expect, it } from "vitest"

import { camelCaseToKebabCase, getPropertyName } from "./strings"

describe("strings", () => {
    describe("#getPropertyName", () => {
        it("converts to kebab case", () => {
            expect(getPropertyName("colorPrimary")).toStrictEqual("--color-primary")
        })

        it("inserts prefixes when included", () => {
            expect(getPropertyName("primary", "magritte", "semanticColor")).toStrictEqual(
                "--magritte-semantic-color-primary",
            )
        })
    })

    describe("#camelCaseToKebabCase", () => {
        it("works with single word", () => {
            expect(camelCaseToKebabCase("hello")).toStrictEqual("hello")
            expect(camelCaseToKebabCase("Goodbye")).toStrictEqual("goodbye")
        })

        it("works with multiple words", () => {
            expect(camelCaseToKebabCase("helloGoodbye")).toStrictEqual("hello-goodbye")
            expect(camelCaseToKebabCase("GoodbyeHello")).toStrictEqual("goodbye-hello")
        })
    })
})
