import { describe, expect, it } from "vitest"

import { getPropertyName } from "./css"

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
})
