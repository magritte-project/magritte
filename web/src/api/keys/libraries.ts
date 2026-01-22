export function libraries() {
    return ["libraries"] as const
}

export function library(libraryId: number) {
    return [...libraries(), libraryId] as const
}

export function libraryPermissions(libraryId: number) {
    return [...library(libraryId), "permissions"] as const
}

export function libraryAlbums<Rest extends any[]>(libraryId: number, ...rest: Rest) {
    return [...library(libraryId), "albums", ...rest] as const
}

export function libraryAlbum(libraryId: number, albumId: number) {
    return [...libraryAlbums(libraryId), albumId] as const
}

export function libraryArtists<Rest extends any[]>(libraryId: number, ...rest: Rest) {
    return [...library(libraryId), "artists", ...rest] as const
}

export function libraryArtist(libraryId: number, artistId: number) {
    return [...libraryArtists(libraryId), artistId] as const
}

export function librarySongs<Rest extends any[]>(libraryId: number, ...rest: Rest) {
    return [...library(libraryId), "songs", ...rest] as const
}

export function librarySong(libraryId: number, songId: number) {
    return [...librarySongs(libraryId), songId] as const
}
