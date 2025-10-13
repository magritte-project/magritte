import {
    createLibrary,
    readLibraries,
    readLibrary,
    readLibrarySongs,
} from "@/api/client"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"

export function useReadLibrariesQuery() {
    return useSuspenseQuery({
        queryKey: ["/libraries/"],
        queryFn: () => readLibraries(),
    })
}

export function useCreateLibraryMutation() {
    return useMutation({
        mutationFn: createLibrary,
    })
}

export function useReadLibraryQuery(library_id: number) {
    return useSuspenseQuery({
        queryKey: ["/libraries/{library_id}", library_id],
        queryFn: () => readLibrary(library_id),
    })
}

export function useReadLibrarySongsQuery(
    library_id: number,
    offset?: number,
    limit?: number,
) {
    return useSuspenseQuery({
        queryKey: ["/libraries/{library_id}", library_id, offset, limit],
        queryFn: () => readLibrarySongs(library_id, offset, limit),
    })
}
