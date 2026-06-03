import type { ExtensionImportAdmin } from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"
import useAPIClient from "@/hooks/apiClientHook"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"

export function useImportExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: ExtensionImportAdmin) => apiClient.importExtension(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: availableExtensions(),
                exact: false,
            })
        },
    })
}

export function useDeleteExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => apiClient.deleteExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: availableExtensions(),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
            await extensionRuntime.sync()
        },
    })
}

export function useInstallExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => apiClient.installExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
            await extensionRuntime.sync()
        },
    })
}

export function useUninstallExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => apiClient.uninstallExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
            await extensionRuntime.sync()
        },
    })
}
