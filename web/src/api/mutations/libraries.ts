import type { APIClient } from "@/api/client"
import type { LibraryCreate } from "@/api/openapi"
import { useMutation } from "@tanstack/react-query"

export function useCreateLibrary(apiClient: APIClient) {
    return useMutation({
        mutationFn: (body: LibraryCreate) => apiClient.createLibrary(body),
    })
}
