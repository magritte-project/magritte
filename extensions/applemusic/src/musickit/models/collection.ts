import { type AlbumResource } from "./album"
import { type UnknownMusicResource } from "./base"
import { type PlaylistResource } from "./playlist"

/**
 * The resource types which contain a browsable list of songs.
 */
export const collectionKinds = [
    "albums",
    "library-albums",
    "playlists",
    "library-playlists",
] as const

export type CollectionKind = (typeof collectionKinds)[number]

/**
 * A resource object which contains a browsable list of songs.
 */
export type CollectionResource = AlbumResource | PlaylistResource

export function isCollectionKind(type: string): type is CollectionKind {
    return (collectionKinds as readonly string[]).includes(type)
}

export function isCollectionResource(
    resource: UnknownMusicResource,
): resource is CollectionResource {
    return isCollectionKind(resource.type)
}

export function getCollectionKind(resource: CollectionResource): CollectionKind {
    if (!isCollectionKind(resource.type)) {
        throw new Error(`Unsupported collection type ${resource.type}`)
    }
    return resource.type
}

export function isPlaylistKind(kind: CollectionKind): boolean {
    return kind === "playlists" || kind === "library-playlists"
}

export function getCollectionKindLabel(kind: CollectionKind): string {
    return isPlaylistKind(kind) ? "Playlist" : "Album"
}

/** The artist of an album, or the curator of a playlist */
export function getCollectionCreator(resource: CollectionResource): string | undefined {
    const attributes = resource.attributes
    if (attributes === undefined) {
        return undefined
    } else if ("artistName" in attributes) {
        return attributes.artistName
    } else if ("curatorName" in attributes) {
        return attributes.curatorName
    } else {
        return undefined
    }
}

export function getCollectionReleaseDate(resource: CollectionResource): string | undefined {
    const attributes = resource.attributes
    return attributes && "releaseDate" in attributes ? attributes.releaseDate : undefined
}
