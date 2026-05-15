import { useMutation, useQueryClient } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"
import type { ExtensionImportAdmin } from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"

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
        },
    })
}

export function useInstallExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (extensionID: number) => apiClient.installExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
        },
    })
}

export function useUninstallExtension() {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (extensionID: number) => apiClient.uninstallExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
        },
    })
}
