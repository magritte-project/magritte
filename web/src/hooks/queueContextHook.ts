import { useQueryClient } from "@tanstack/react-query"

import useAPI from "@/hooks/apiHook"
import type { QueueContext } from "@/playback/queue/base"

export default function useQueueContext(): QueueContext {
    const api = useAPI()
    const queryClient = useQueryClient()
    return {
        api,
        queryClient,
    }
}
