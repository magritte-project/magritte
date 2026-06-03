import type { ExtensionManifest, ExtensionPermissions } from "@magritte/api"

export function enforcePermissions<Args extends any[], R>(
    manifest: ExtensionManifest,
    permissions: readonly ExtensionPermissions[],
    method: (...args: Args) => R,
): (...args: Args) => R {
    const missingPermission = permissions.find(
        (permission) => !manifest.permissions?.includes(permission),
    )
    if (missingPermission !== undefined) {
        return () => {
            throw new Error(`${missingPermission} permission required`)
        }
    } else {
        return method
    }
}
