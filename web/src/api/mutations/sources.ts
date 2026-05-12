import { useMutation } from "@tanstack/react-query"

import type { SourceCreate } from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"

export function useCreateSource() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SourceCreate) => apiClient.createSource(body),
    })
}
