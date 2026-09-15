import { type AlbumResource } from "./album"
import { type MusicArtwork, type MusicRelationship, type MusicResource } from "./base"

/**
 * The attributes for an artist resource.
 */
export interface ArtistAttributes {
    readonly artwork?: MusicArtwork
    readonly genreNames?: string[]
    readonly name: string
    readonly url?: string
}

/**
 * The relationships for an artist resource.
 */
export interface ArtistRelationships {
    readonly albums?: MusicRelationship<AlbumResource>
}

/**
 * A resource object that represents a catalog artist.
 */
export interface ArtistResource extends MusicResource<ArtistAttributes, ArtistRelationships> {}
