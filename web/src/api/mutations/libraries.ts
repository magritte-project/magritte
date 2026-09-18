import type {
    LibraryCreate,
    LibraryPermissionCreate,
    LibraryPermissionUpdate,
    LibraryUpdate,
    SongUpdate,
} from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
    libraries,
    library,
    libraryAlbums,
    libraryArtists,
    libraryIgnoredResources,
    libraryPermissions,
    librarySong,
    librarySongs,
} from "@/api/keys/libraries"
import useAPI from "@/hooks/apiHook"

export function useCreateLibrary() {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: LibraryCreate) => client.createLibrary(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: libraries() })
        },
    })
}

export function useUpdateLibrary(libraryId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: LibraryUpdate) => client.updateLibrary(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: libraries() })
            await queryClient.invalidateQueries({ queryKey: library(libraryId) })
        },
    })
}

export function useCreateLibraryPermission(libraryId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: LibraryPermissionCreate) =>
            client.createLibraryPermission(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useUpdateLibraryPermission(libraryId: number, userId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: LibraryPermissionUpdate) =>
            client.updateLibraryPermission(libraryId, userId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useDeleteLibraryPermission(libraryId: number, userId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: () => client.deleteLibraryPermission(libraryId, userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryPermissions(libraryId),
            })
        },
    })
}

export function useDeleteLibraryIgnoredResource(libraryId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (resourceId: number) =>
            client.deleteLibraryIgnoredResource(libraryId, resourceId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryIgnoredResources(libraryId),
                exact: false,
            })
        },
    })
}

export function useUpdateLibrarySong(libraryId: number, songId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: SongUpdate) => client.updateLibrarySong(libraryId, songId, body),
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
    const { client } = useAPI()
    return useMutation({
        mutationFn: (songId: number) => client.deleteLibrarySong(libraryId, songId),
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
