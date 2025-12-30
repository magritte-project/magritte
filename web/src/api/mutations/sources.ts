import type { SourceCreate } from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"
import { useMutation } from "@tanstack/react-query"

export function useCreateSource() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SourceCreate) => apiClient.createSource(body),
    })
}
