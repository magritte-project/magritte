import type { IngestSong } from "@magritte/api"
import type { PlayableItem } from "@magritte/sdk"

import type { SongResource } from "@/musickit/models/song"
import { formatArtworkUrl } from "@/utilities/artwork"

/** The URL of the source used to play a song, which also identifies it in libraries */
export function songResourceToSourceUrl(song: SongResource): string {
    // Library songs (from library albums and playlists) have their own IDs, prefer the catalog's
    const songId = song.attributes?.playParams?.catalogId ?? song.id
    return `applemusic:///songs/${songId}`
}

export function songResourceToIngestSong(song: SongResource): IngestSong {
    return {
        start_time: 0,
        end_time: (song.attributes?.durationInMillis ?? 0) / 1000,
        sources: [
            {
                url: songResourceToSourceUrl(song),
                mime_type: null,
                extension_manifest_id: "magritte.applemusic",
                extension_tag: String(song.id),
            },
        ],
        artworks: song.attributes?.artwork
            ? [
                  {
                      kind: "front_cover",
                      image_url: formatArtworkUrl(song.attributes.artwork, 1000),
                      background_color: song.attributes.artwork.bgColor ?? null,
                      primary_color: song.attributes.artwork.textColor1 ?? null,
                      secondary_color: song.attributes.artwork.textColor2 ?? null,
                      tertiary_color: song.attributes.artwork.textColor3 ?? null,
                  },
              ]
            : [],
        title: song.attributes?.name ?? "",
        artist_name: song.attributes?.artistName ?? null,
        album_title: song.attributes?.albumName ?? null,
        album_artist: null,
        composer: song.attributes?.composerName ?? null,
        genre: song.attributes?.genreNames?.join(", ") ?? null,
        release_date: song.attributes?.releaseDate ?? null,
        track_number: song.attributes?.trackNumber ?? null,
        track_total: null,
        disc_number: song.attributes?.discNumber ?? null,
        disc_total: null,
        lyrics: null,
        rating: null,
        bpm: null,
        comment: "Apple Music",
        grouping: null,
        mcn: null,
        isrc: song.attributes?.isrc ?? null,
        music_brainz_release_id: null,
        music_brainz_recording_id: null,
    }
}

export function songResourceToPlayableItem(song: SongResource): PlayableItem {
    return {
        id: song.id,
        ...songResourceToIngestSong(song),
    }
}
