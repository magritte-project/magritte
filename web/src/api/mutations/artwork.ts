import type { ArtworkCreate } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPIClient from "@/hooks/apiClientHook"

export function useCreateArtwork() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: ArtworkCreate) => apiClient.createArtwork(body),
    })
}
