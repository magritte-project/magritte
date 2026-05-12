import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
    libraries,
    library,
    libraryAlbums,
    libraryArtists,
    libraryPermissions,
    librarySong,
    librarySongs,
} from "@/api/keys/libraries"
import type {
    LibraryCreate,
    LibraryPermissionCreate,
    LibraryPermissionUpdate,
    LibraryUpdate,
    SongUpdate,
} from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"

export function useCreateLibrary() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryCreate) => apiClient.createLibrary(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: libraries() })
        },
    })
}

export function useUpdateLibrary(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryUpdate) => apiClient.updateLibrary(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: libraries() })
            await queryClient.invalidateQueries({ queryKey: library(libraryId) })
        },
    })
}

export function useCreateLibraryPermission(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryPermissionCreate) =>
            apiClient.createLibraryPermission(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useUpdateLibraryPermission(libraryId: number, userId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryPermissionUpdate) =>
            apiClient.updateLibraryPermission(libraryId, userId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useDeleteLibraryPermission(libraryId: number, userId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: () => apiClient.deleteLibraryPermission(libraryId, userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useUpdateLibrarySong(libraryId: number, songId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SongUpdate) => apiClient.updateLibrarySong(libraryId, songId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: librarySong(libraryId, songId),
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
                exact: false,
            })
        },
    })
}

export function useDeleteLibrarySong(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (songId: number) => apiClient.deleteLibrarySong(libraryId, songId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryAlbums(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: libraryArtists(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
                exact: false,
            })
        },
    })
}
