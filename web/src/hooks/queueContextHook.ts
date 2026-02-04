import { useQueryClient } from "@tanstack/react-query"

import type { QueueContext } from "@/playback/queue/base"

import useAPIClient from "@/hooks/apiClientHook"

export default function useQueueContext(): QueueContext {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return {
        apiClient,
        queryClient,
    }
}
