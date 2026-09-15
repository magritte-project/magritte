import {
    type MusicArtwork,
    type MusicEditorialNotes,
    type MusicPlayParameters,
    type MusicRelationship,
    type MusicResource,
    type UnknownMusicResource,
} from "./base"
import { type SongResource } from "./song"

/**
 * The attributes for an album resource. Library albums share a subset of these.
 */
export interface AlbumAttributes {
    readonly artistName?: string
    readonly artwork?: MusicArtwork
    readonly contentRating?: string
    readonly editorialNotes?: MusicEditorialNotes
    readonly genreNames?: string[]
    readonly isCompilation?: boolean
    readonly isSingle?: boolean
    readonly name: string
    readonly playParams?: MusicPlayParameters
    readonly releaseDate?: string
    readonly trackCount?: number
    readonly url?: string
}

/**
 * The relationships for an album resource.
 */
export interface AlbumRelationships {
    readonly artists?: MusicRelationship<UnknownMusicResource>
    readonly tracks?: MusicRelationship<SongResource>
}

/**
 * A resource object that represents a catalog album (`albums`) or a library album (`library-albums`).
 */
export interface AlbumResource extends MusicResource<AlbumAttributes, AlbumRelationships> {}
