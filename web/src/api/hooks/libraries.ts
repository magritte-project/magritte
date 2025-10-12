import { createLibrary, readLibrary, readLibrarySongs } from "@/api/client"
import { useMutation, useQuery } from "@tanstack/react-query"

export function useCreateLibraryMutation() {
    return useMutation({
        mutationFn: createLibrary,
    })
}

export function useReadLibraryQuery(library_id: number) {
    return useQuery({
        queryKey: ["/libraries/{library_id}", library_id],
        queryFn: () => readLibrary(library_id),
    })
}

export function useReadLibrarySongsQuery(
    library_id: number,
    offset: number,
    limit: number,
) {
    return useQuery({
        queryKey: ["/libraries/{library_id}", library_id, offset, limit],
        queryFn: () => readLibrarySongs(library_id, offset, limit),
    })
}
