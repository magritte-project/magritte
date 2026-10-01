import { describe, expect, it } from "vitest"

import { camelCaseToKebabCase, camelCaseToTitleCase } from "./strings"

describe("strings", () => {
    describe("#camelCaseToTitleCase", () => {
        it("works with single word", () => {
            expect(camelCaseToTitleCase("hello")).toStrictEqual("Hello")
            expect(camelCaseToTitleCase("Goodbye")).toStrictEqual("Goodbye")
        })

        it("works with multiple words", () => {
            expect(camelCaseToTitleCase("fontFamily")).toStrictEqual("Font Family")
            expect(camelCaseToTitleCase("onKeyActive")).toStrictEqual("On Key Active")
            expect(camelCaseToTitleCase("XMLHttpRequest")).toStrictEqual("XML Http Request")
            expect(camelCaseToTitleCase("parseHTML")).toStrictEqual("Parse HTML")
            expect(camelCaseToTitleCase("h1Title")).toStrictEqual("H1 Title")
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
