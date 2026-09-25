import { CommandInputsDidChange } from "@magritte/sdk"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { commandInputs } from "@/api/keys/commandInputs"
import { readOnScreenLibraryIds } from "@/api/queries/commandInputs"
import useExtensionHost from "@/hooks/extensionHostHook"

/**
 * Returns the IDs of the libraries the host currently has on screen.
 *
 * The list is empty when nothing library-related is on screen, or when
 * the user has not granted permission to read the host's on screen context.
 */
export default function useOnScreenLibraryIds(): readonly number[] {
    const extensionHost = useExtensionHost()
    const queryClient = useQueryClient()
    useEffect(() => {
        const { broadcaster } = extensionHost.connection
        if (!broadcaster.isValid) {
            return
        }
        const subscription = broadcaster.subscribe(CommandInputsDidChange, () => {
            queryClient.invalidateQueries({ queryKey: commandInputs() })
        })
        return () => subscription.unsubscribe()
    }, [extensionHost, queryClient])

    const onScreenQuery = useQuery(readOnScreenLibraryIds(extensionHost))
    return onScreenQuery.data ?? []
}
