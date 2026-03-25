import { describe, expect, it } from "vitest"

import { zExtensionPermissions } from "./manifest"

describe("manifest", () => {
    describe("#extensionPermissionsSchema", () => {
        it("should reject unknown permissions", () => {
            expect(() => zExtensionPermissions.parse("whatever")).toThrow()
        })
    })
})
