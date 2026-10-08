import type { YouTubeClient } from "@/youtube/client"
import { pickArtistVideos, pickSongVideos } from "@/youtube/match"
import type { MusicVideoLookup } from "@/youtube/types"

const SONG_RESULTS = 15
const ARTIST_RESULTS = 25

/**
 * Find what YouTube has for a song: its official music video, failing that its
 * most viewed video, and failing that the artist's channel and videos.
 *
 * Costs one search when the song has a video and two when it does not.
 */
export async function findMusicVideos(
    client: YouTubeClient,
    artist: string,
    songTitle: string | null | undefined,
): Promise<MusicVideoLookup> {
    if (songTitle) {
        const { videoIds } = await client.search({
            query: `${artist} ${songTitle}`,
            types: ["video"],
            maxResults: SONG_RESULTS,
        })
        const song = pickSongVideos(await client.getVideos(videoIds), artist, songTitle)
        if (song !== null) {
            return song
        }
    }

    const found = await client.search({
        query: artist,
        types: ["channel", "video"],
        maxResults: ARTIST_RESULTS,
    })
    const videos = await client.getVideos(found.videoIds)
    // The artist's channel is not always among the results, but their videos point to it
    const channelIds = new Set([...found.channelIds, ...videos.map((video) => video.channelId)])
    const channels = await client.getChannels([...channelIds])
    return pickArtistVideos(videos, channels, artist)
}
