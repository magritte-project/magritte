export interface PlayableItemArtwork {
    readonly image_url: string
    readonly background_color: string | null
    readonly primary_color: string | null
    readonly secondary_color: string | null
    readonly tertiary_color: string | null
}

export interface PlayableItemSource {
    readonly url: string
    readonly mime_type: string | null
}

export interface PlayableItem {
    readonly id: unknown
    readonly artist_name?: string | null
    readonly album_title?: string | null
    readonly artworks?: readonly PlayableItemArtwork[]
    readonly sources?: readonly PlayableItemSource[]
    readonly start_time: number
    readonly end_time: number
    readonly title?: string | null
    readonly genre?: string | null
    readonly release_date?: string | null
    readonly track_number?: number | null
    readonly track_total?: number | null
    readonly disc_number?: number | null
    readonly disc_total?: number | null
    readonly lyrics?: string | null
    readonly rating?: number | null
}
