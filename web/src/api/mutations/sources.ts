import type { SourceCreate } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPIClient from "@/hooks/apiClientHook"

export function useCreateSource() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SourceCreate) => apiClient.createSource(body),
    })
}
