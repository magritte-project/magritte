export function libraries() {
    return ["libraries"] as const
}

export function library(libraryId: number) {
    return [...libraries(), libraryId] as const
}

export function libraryAlbums(libraryId: number) {
    return [...library(libraryId), "albums"] as const
}

export function libraryAlbum(libraryId: number, albumId: number) {
    return [...libraryAlbums(libraryId), albumId] as const
}

export function libraryArtists(libraryId: number) {
    return [...library(libraryId), "artists"] as const
}

export function libraryArtist(libraryId: number, artistId: number) {
    return [...libraryArtists(libraryId), artistId] as const
}

export function librarySongs(libraryId: number) {
    return [...library(libraryId), "songs"] as const
}

export function librarySong(libraryId: number, songId: number) {
    return [...librarySongs(libraryId), songId] as const
}
