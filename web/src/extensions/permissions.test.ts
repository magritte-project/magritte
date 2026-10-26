import type { ExtensionPermissions } from "@magritte/api"
import { expect, it } from "vitest"
import { describe } from "vitest"

import { getExtensionPermissionInfo } from "./permissions"

describe("permissions", () => {
    describe("#getExtensionPermissionInfo", () => {
        it("should provide info for known permissions", () => {
            const { name, description } = getExtensionPermissionInfo(
                "run:background" satisfies ExtensionPermissions,
            )
            expect(name).toBe("Runs In Background")
            expect(description).toBe(
                "The extension may run in the background, even when not in use.",
            )
        })

        it("should handle unknown permissions gracefully", () => {
            const { name, description } = getExtensionPermissionInfo("future:thing")
            expect(name).toBe("future:thing")
            expect(description).toBe(
                "The extension has a permission which is not supported by this version of Magritte",
            )
        })
    })
})
