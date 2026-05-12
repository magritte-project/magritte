import { useQueryClient } from "@tanstack/react-query"

import useAPIClient from "@/hooks/apiClientHook"
import type { QueueContext } from "@/playback/queue/base"

export default function useQueueContext(): QueueContext {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return {
        apiClient,
        queryClient,
    }
}
