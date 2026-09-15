import {
    type MusicArtwork,
    type MusicDescriptionAttribute,
    type MusicPlayParameters,
    type MusicRelationship,
    type MusicResource,
} from "./base"
import { type SongResource } from "./song"

/**
 * The attributes for a playlist resource. Library playlists share a subset of these.
 */
export interface PlaylistAttributes {
    readonly artwork?: MusicArtwork
    readonly curatorName?: string
    readonly description?: MusicDescriptionAttribute
    readonly name: string
    readonly playParams?: MusicPlayParameters
    readonly url?: string
}

/**
 * The relationships for a playlist resource.
 */
export interface PlaylistRelationships {
    readonly tracks?: MusicRelationship<SongResource>
}

/**
 * A resource object that represents a catalog playlist (`playlists`) or a library playlist (`library-playlists`).
 */
export interface PlaylistResource extends MusicResource<
    PlaylistAttributes,
    PlaylistRelationships
> {}
