import { useQueryClient } from "@tanstack/react-query"

import type { QueueShardContext } from "@/playback/queueShards/base"

import useAPIClient from "@/hooks/apiClientHook"

export default function useQueueShardContext(): QueueShardContext {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return {
        apiClient,
        queryClient,
    }
}
