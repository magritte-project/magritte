import type { IngestSong } from "@magritte/api"
import type { PlayableItem } from "@magritte/sdk"

import type { SongResource } from "@/musickit/models/song"

export function songResourceToIngestSong(song: SongResource): IngestSong {
    return {
        start_time: 0,
        end_time: (song.attributes?.durationInMillis ?? 0) / 1000,
        sources: [
            {
                url: `applemusic:///songs/${song.id}`,
                mime_type: null,
            },
        ],
        artworks: song.attributes?.artwork
            ? [
                  {
                      kind: "front_cover",
                      image_url: song.attributes.artwork.url
                          .replace("{w}", String(Math.min(1000, song.attributes.artwork.width)))
                          .replace("{h}", String(Math.min(1000, song.attributes.artwork.height))),
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
