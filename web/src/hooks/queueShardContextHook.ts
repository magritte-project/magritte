import useAPIClient from "@/hooks/apiClientHook"
import type { QueueShardContext } from "@/playback/queueShards/base"
import { useQueryClient } from "@tanstack/react-query"

export default function useQueueShardContext(): QueueShardContext {
    const apiClient = useAPIClient()
    const queryClient = useQueryClient()
    return {
        apiClient,
        queryClient,
    }
}
