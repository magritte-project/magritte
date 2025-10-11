import { useMutation, useQuery } from "@tanstack/react-query"
import { apiClient, unwrap } from "../client"
import type { LibraryCreate } from "../openapi"

export function useCreateLibrary() {
    return useMutation({
        mutationFn: async (body: LibraryCreate) => {
            const response = await apiClient.POST("/libraries/create", {
                body,
            })
            return unwrap(response)
        },
    })
}

export function useReadLibrary(library_id: number) {
    return useQuery({
        queryKey: ["/libraries/{library_id}", library_id],
        queryFn: async () => {
            const response = await apiClient.GET("/libraries/{library_id}", {
                params: {
                    path: {
                        library_id,
                    },
                },
            })
            return unwrap(response)
        },
    })
}

export function useReadLibrarySongs(
    library_id: number,
    offset: number,
    limit: number,
) {
    return useQuery({
        queryKey: ["/libraries/{library_id}", library_id, offset, limit],
        queryFn: async () => {
            const response = await apiClient.GET(
                "/libraries/{library_id}/songs",
                {
                    params: {
                        path: {
                            library_id,
                        },
                        query: {
                            offset,
                            limit,
                        },
                    },
                },
            )
            return unwrap(response)
        },
    })
}
