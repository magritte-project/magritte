import type { JsonStructure } from "react-cmdk"

import { SignInIcon, SignOutIcon } from "@phosphor-icons/react"

import type { PlaybackEngine } from "@/playback/engine"
import type {
    CommandsService,
    PlaybackService,
    Service,
    ServiceConstructorOptions,
    ServiceGroup,
    SongSearchService,
    StreamingMusicServiceSongsRead,
} from "@/services/base"

import type { MusicSearchResponse } from "./models/search"

import AppleMusicPlaybackEngine from "./engine"
import { initializeMusicKit } from "./initialization"

class AppleMusicCommandService implements CommandsService {
    readonly type = "commands" as const
    readonly groupID = "com.apple.music"
    readonly name = "Apple Music"

    constructor(private readonly musicKit: MusicKit.Instance) {}

    get commands(): JsonStructure {
        return [
            {
                id: "AppleMusicService",
                heading: this.name,
                items: this.musicKit.isAuthorized
                    ? [
                          {
                              id: "AppleMusicService.unauthorize",
                              icon: SignOutIcon,
                              children: "Unauthorize",
                              onClick: () => {
                                  this.musicKit.unauthorize()
                              },
                          },
                      ]
                    : [
                          {
                              id: "AppleMusicService.authorize",
                              icon: SignInIcon,
                              children: "Authorize",
                              onClick: () => {
                                  this.musicKit.authorize()
                              },
                          },
                      ],
            },
        ]
    }
}

class AppleMusicPlaybackService implements PlaybackService {
    readonly type = "playback" as const
    readonly groupID = "com.apple.music"
    readonly name = "Apple Music"
    readonly playbackEngine: PlaybackEngine

    constructor(musicKit: MusicKit.Instance) {
        this.playbackEngine = new AppleMusicPlaybackEngine(musicKit)
    }
}

class AppleMusicSongSearchService implements SongSearchService {
    readonly type = "songSearch" as const
    readonly groupID = "com.apple.music"
    readonly name = "Apple Music"

    constructor(private readonly musicKit: MusicKit.Instance) {}

    async searchSongs(
        query: string,
        offset: number = 0,
        limit: number = 20,
    ): Promise<StreamingMusicServiceSongsRead> {
        const { data: response } = await this.musicKit.api.music<MusicSearchResponse>(
            "/v1/catalog/{{storefrontId}}/search",
            {
                term: query,
                types: "songs",
                offset: String(offset),
                limit: String(limit),
            },
        )
        const songData = response.results!.songs!.data!
        return {
            items: songData.map((song) => ({
                id: song.id,
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
                                  .replace(
                                      "{w}",
                                      String(Math.min(1000, song.attributes.artwork.width)),
                                  )
                                  .replace(
                                      "{h}",
                                      String(Math.min(1000, song.attributes.artwork.height)),
                                  ),
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
            })),
            offset: offset,
            limit: limit,
        }
    }
}

export const AppleMusic: ServiceGroup = {
    id: "com.apple.music",
    async construct({ apiClient }: ServiceConstructorOptions): Promise<readonly Service[]> {
        const instanceStatus = await apiClient.instanceStatus()
        if (!instanceStatus.available_functions.includes("apple_music_token")) {
            return []
        }
        const tokenResult = (await apiClient.callFunction("apple_music_token")) as {
            developer_token: string
        }
        const musicKit = await initializeMusicKit({
            developerToken: tokenResult.developer_token,
            app: {
                name: "Magritte",
            },
        })
        return [
            new AppleMusicCommandService(musicKit),
            new AppleMusicPlaybackService(musicKit),
            new AppleMusicSongSearchService(musicKit),
        ]
    },
}
