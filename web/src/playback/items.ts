import type { SongRead } from "@magritte/api"
import { createPlayableItemId, type PlayableItem } from "@magritte/sdk"

/** Create a playable item id for a song */
export function createSongPlayableItemId(id: number): string {
    return createPlayableItemId("library", "song", id)
}

/** Convert a song into a playable item. */
export function songToPlayableItem(song: SongRead): PlayableItem {
    return {
        kind: "song",
        id: createSongPlayableItemId(song.id),
        title: song.title,
        creator: song.artist_name,
        collection: song.album_title,
        artworks: song.artworks,
        sources: song.sources,
        startTime: song.start_time,
        endTime: song.end_time,
        rating: song.rating,
        releaseDate: song.release_date,
    }
}
