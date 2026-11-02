import type { API, ExtensionManifest, ExtensionPermissions } from "@magritte/api"
import { RPCBroadcaster } from "@magritte/rpc"
import {
    InstallableExtensionsDidChange,
    InstalledExtensionsDidChange,
    type Extensions,
} from "@magritte/sdk"
import { QueryObserver, type QueryClient } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"
import {
    readAvailableExtension,
    readAvailableExtensions,
    readInstalledExtensions,
} from "@/api/queries/extensions"
import { enforcePermissions } from "@/extensions/exports/permissions"
import type { ExtensionRuntime } from "@/extensions/runtime"
import type { NotificationCenter } from "@/notifications/center"

export function exportExtensions(
    manifest: ExtensionManifest,
    broadcaster: RPCBroadcaster,
    api: API,
    queryClient: QueryClient,
    notificationCenter: NotificationCenter,
    runtime: ExtensionRuntime,
): Extensions {
    if (manifest.permissions?.includes("extensions:read" satisfies ExtensionPermissions)) {
        const unsubscribe = runtime.subscribe((event) => {
            switch (event.type) {
                case "extensionAdded":
                case "extensionRemoved":
                    broadcaster.send(InstalledExtensionsDidChange, undefined)
                    break
            }
        })
        broadcaster.subscribe(RPCBroadcaster.invalidated, () => {
            unsubscribe()
        })
    }
    if (manifest.permissions?.includes("extensions:admin" satisfies ExtensionPermissions)) {
        const observer = new QueryObserver(queryClient, readAvailableExtensions(api))
        const unsubscribe = observer.subscribe((result) => {
            if (result.isSuccess) {
                broadcaster.send(InstallableExtensionsDidChange, undefined)
            }
        })
        broadcaster.subscribe(RPCBroadcaster.invalidated, () => {
            unsubscribe()
        })
    }
    return {
        readInstalled: enforcePermissions(
            manifest,
            ["extensions:read"],
            async ({ offset, limit }) => {
                return await queryClient.query(readInstalledExtensions(api, offset, limit))
            },
        ),
        requestInstall: enforcePermissions(
            manifest,
            ["extensions:write"],
            async ({ extensionId }) => {
                const extension = await queryClient.query(readAvailableExtension(api, extensionId))
                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to install ${extension.manifest.name}?`,
                    message: `This operation was initiated by ${manifest.name}. The extension may be uninstalled later.`,
                    confirmButtonLabel: "Install",
                })
                if (!confirmed) {
                    throw new Error("Denied by user")
                }
                await api.client.installExtension(extensionId)
                await queryClient.invalidateQueries({
                    queryKey: installedExtensions(),
                    exact: false,
                })
                await runtime.sync()
            },
        ),
        requestUninstall: enforcePermissions(
            manifest,
            ["extensions:write"],
            async ({ extensionId }) => {
                const extension = await queryClient.query(readAvailableExtension(api, extensionId))
                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to uninstall ${extension.manifest.name}?`,
                    message: `This operation was initiated by ${manifest.name}. The extension may be reinstalled later.`,
                    destructive: true,
                    confirmButtonLabel: "Uninstall",
                })
                if (!confirmed) {
                    throw new Error("Denied by user")
                }
                await api.client.uninstallExtension(extensionId)
                await queryClient.invalidateQueries({
                    queryKey: installedExtensions(),
                    exact: false,
                })
                await runtime.sync()
            },
        ),

        canAdminister: enforcePermissions(manifest, ["extensions:admin"], async () => {
            return api.userSessionManager.hasScope("admin")
        }),
        readInstallable: enforcePermissions(
            manifest,
            ["extensions:admin"],
            async ({ offset, limit }) => {
                return await queryClient.query(readAvailableExtensions(api, offset, limit))
            },
        ),
        requestImport: enforcePermissions(
            manifest,
            ["extensions:admin"],
            async ({ manifestUrl }) => {
                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to import an extension from ${manifestUrl}?`,
                    message:
                        `This operation was initiated by ${manifest.name}. ` +
                        "The extension will be installable for all users on this instance. " +
                        "Only import extensions from sources you trust.",
                    destructive: true,
                    confirmButtonLabel: "Import",
                })
                if (!confirmed) {
                    throw new Error("Denied by user")
                }
                await api.client.importExtension({ manifest_url: manifestUrl })
                await queryClient.invalidateQueries({
                    queryKey: availableExtensions(),
                    exact: false,
                })
            },
        ),
        requestUpdate: enforcePermissions(
            manifest,
            ["extensions:admin"],
            async ({ extensionId }) => {
                await api.client.updateExtension(extensionId)
                await queryClient.invalidateQueries({
                    queryKey: availableExtensions(),
                    exact: false,
                })
                await queryClient.invalidateQueries({
                    queryKey: installedExtensions(),
                    exact: false,
                })
                await runtime.sync()
            },
        ),
        requestDelete: enforcePermissions(
            manifest,
            ["extensions:admin"],
            async ({ extensionId }) => {
                const extension = await queryClient.query(readAvailableExtension(api, extensionId))
                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to remove the extension ${extension.manifest.name}?`,
                    message:
                        `This operation was initiated by ${manifest.name}. ` +
                        "The extension will be removed for all users on this instance.",
                    destructive: true,
                    confirmButtonLabel: "Remove",
                })
                if (!confirmed) {
                    throw new Error("Denied by user")
                }
                await api.client.deleteExtension(extensionId)
                await queryClient.invalidateQueries({
                    queryKey: availableExtensions(),
                    exact: false,
                })
                await queryClient.invalidateQueries({
                    queryKey: installedExtensions(),
                    exact: false,
                })
                await runtime.sync()
            },
        ),
    }
}
