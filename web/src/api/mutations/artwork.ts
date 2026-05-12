import { useMutation } from "@tanstack/react-query"

import type { ArtworkCreate } from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"

export function useCreateArtwork() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: ArtworkCreate) => apiClient.createArtwork(body),
    })
}
