import type { ExtensionImportAdmin } from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"
import useAPI from "@/hooks/apiHook"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"

export function useImportExtension() {
    const { client } = useAPI()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: ExtensionImportAdmin) => client.importExtension(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: availableExtensions(),
                exact: false,
            })
        },
    })
}

export function useDeleteExtension() {
    const { client } = useAPI()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => client.deleteExtension(extensionID),
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
    const { client } = useAPI()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => client.installExtension(extensionID),
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
    const { client } = useAPI()
    const queryClient = useQueryClient()
    const extensionRuntime = useExtensionRuntime()
    return useMutation({
        mutationFn: (extensionID: number) => client.uninstallExtension(extensionID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: installedExtensions(),
                exact: false,
            })
            await extensionRuntime.sync()
        },
    })
}
