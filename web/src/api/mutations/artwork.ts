import type { ArtworkCreate } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPI from "@/hooks/apiHook"

export function useCreateArtwork() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: ArtworkCreate) => client.createArtwork(body),
    })
}
