import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"

import type { SearchCommandItem, SearchCommandSection } from "@/commands/base"
import useCommandInputs from "@/hooks/commandInputsHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useSearchRegistry from "@/hooks/searchRegistryHook"
import { getErrorMessage } from "@/utilities/errors"
import { justEventsMatching } from "@/utilities/events"

export interface UseSearchCommandsOptions {
    readonly search?: string
}

export interface UseSearchCommandsResult {
    readonly resultSections: readonly SearchCommandSection[]
    readonly playItem: (item: SearchCommandItem) => Promise<void>
    readonly addItemToLibrary: (item: SearchCommandItem) => Promise<void>
    readonly revealItem: (item: SearchCommandItem) => Promise<void>
}

export default function useSearchCommands({
    search = "",
}: UseSearchCommandsOptions = {}): UseSearchCommandsResult {
    const searchRegistry = useSearchRegistry()
    const inputs = useCommandInputs()
    const resultQuery = useQuery({
        queryKey: ["commands", "search", search],
        queryFn: () => searchRegistry.search(search, inputs),
        placeholderData: keepPreviousData,
    })
    useEffect(() => {
        return inputs.subscribe(
            justEventsMatching("type", "commandInputsDidChange", () => {
                void resultQuery.refetch()
            }),
        )
    }, [inputs, resultQuery])
    const resultSections = resultQuery.data ?? []

    const notificationCenter = useNotificationCenter()
    const playItem = useCallback(
        async (item: SearchCommandItem) => {
            if (!item.play) {
                notificationCenter.showToast({ message: "Play not supported", type: "info" })
                return
            }
            try {
                await item.play()
            } catch (error) {
                notificationCenter.showToast({
                    message: `Play failed: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
        [notificationCenter],
    )
    const addItemToLibrary = useCallback(
        async (item: SearchCommandItem) => {
            if (!item.addToLibrary) {
                notificationCenter.showToast({
                    message: "Add to library not available",
                    type: "info",
                })
                return
            }
            try {
                await item.addToLibrary()
            } catch (error) {
                notificationCenter.showToast({
                    message: `Add to library failed: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
        [notificationCenter],
    )
    const revealItem = useCallback(
        async (item: SearchCommandItem) => {
            if (!item.reveal) {
                notificationCenter.showToast({ message: "Reveal not available", type: "info" })
                return
            }
            try {
                await item.reveal()
            } catch (error) {
                notificationCenter.showToast({
                    message: `Reveal failed: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
        [notificationCenter],
    )

    return { resultSections, playItem, addItemToLibrary, revealItem }
}
