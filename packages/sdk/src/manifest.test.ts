import { describe, expect, it } from "vitest"

import { extensionPermissionsSchema } from "./manifest"

describe("manifest", () => {
    describe("#extensionPermissionsSchema", () => {
        it("should reject unknown permissions", () => {
            expect(() => extensionPermissionsSchema.parse("whatever")).toThrow()
        })
    })
})
