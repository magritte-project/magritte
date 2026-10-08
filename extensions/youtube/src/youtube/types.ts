export interface YouTubeVideo {
    readonly id: string
    readonly title: string
    readonly channelId: string
    readonly channelTitle: string
    readonly thumbnailUrl?: string
    readonly durationSec?: number
    /** When the video was uploaded, as an ISO 8601 timestamp */
    readonly publishedAt?: string
    readonly viewCount: number
    /** Whether the uploader allows the video to be played outside of youtube.com */
    readonly embeddable: boolean
}

export interface YouTubeChannel {
    readonly id: string
    readonly title: string
    readonly thumbnailUrl?: string
    /** Missing when the channel hides its subscriber count */
    readonly subscriberCount?: number
    /** The channel's `@handle` */
    readonly handle?: string
    readonly description?: string
    readonly videoCount?: number
    /** The playlist holding everything the channel has uploaded */
    readonly uploadsPlaylistId?: string
}

/**
 * What YouTube has for a song, from best to worst:
 *
 * - `official`: the music video, from the artist's own or VEVO channel.
 * - `popular`: no official video, so the most viewed video of the song.
 * - `artist`: no video of the song at all, so the artist's channel and videos.
 */
export type MusicVideoLookup =
    | {
          readonly kind: "official" | "popular"
          readonly video: YouTubeVideo
          /** Other videos of the same song, most viewed first */
          readonly alternates: readonly YouTubeVideo[]
      }
    | {
          readonly kind: "artist"
          readonly channel: YouTubeChannel | null
          readonly videos: readonly YouTubeVideo[]
      }

export function getVideoUrl(video: YouTubeVideo): string {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`
}

export function getChannelUrl(channelId: string): string {
    return `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`
}

export function getSearchUrl(query: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
