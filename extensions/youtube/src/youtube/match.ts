import type { MusicVideoLookup, YouTubeChannel, YouTubeVideo } from "@/youtube/types"

const MAX_ALTERNATES = 5
const MAX_ARTIST_VIDEOS = 12

/**
 * Suffixes that distinguish editions of the same song, which the playing item
 * may carry but a video's title will not, e.g. `(2011 Remaster)`.
 */
const EDITION_SUFFIXES =
    /\s*[([][^)\]]*\b(remaster(?:ed)?|deluxe|expanded|anniversary|edition|explicit|bonus|mono|stereo|version|mix|edit|feat\.?|featuring)\b[^)\]]*[)\]]\s*$/i

const DASHED_EDITION_SUFFIXES =
    /\s+[-–—]\s+(?:\d{4}\s+)?(?:remaster(?:ed)?|deluxe|expanded|anniversary|explicit|mono|stereo|single|radio|album)\b.*$/i

/** Words a channel adds around the artist's name, as in `NirvanaVEVO` */
const CHANNEL_SUFFIXES = /(vevo|official|music|tv|band|channel|videos)$/
const CHANNEL_PREFIXES = /^(official|the)/

/** What splits a credit such as `A feat. B` or `A, B & C` into its artists */
const ARTIST_SEPARATORS = /\s+(?:feat\.?|ft\.?|featuring|x|&)\s+|\s*[,;]\s*/i

/** Titles which say they are the music video */
const OFFICIAL_VIDEO_MARKERS =
    /\b(official( \w+)? video|music video|video oficial|clip officiel|official mv)\b/

/** Titles of uploads that are something other than the music video */
const NOT_THE_VIDEO_MARKERS = [
    "lyric",
    "lyrics",
    "audio",
    "visualizer",
    "visualiser",
    "live",
    "cover",
    "karaoke",
    "instrumental",
    "remix",
    "reaction",
    "behind the scenes",
    "making of",
    "teaser",
    "trailer",
    "interview",
    "rehearsal",
    "acoustic",
    "demo",
    "sped up",
    "slowed",
    "full album",
]

/**
 * Reduce a title or name to space separated lowercase words, so differences in
 * case, accents and punctuation do not get in the way of comparing two.
 */
export function fold(value: string | null | undefined): string {
    return (value ?? "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[’'`]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
}

/** Whether the words of `phrase` appear, in order and whole, within `text` */
function containsPhrase(text: string, phrase: string): boolean {
    return phrase.length > 0 && ` ${text} `.includes(` ${phrase} `)
}

function stripEditionSuffixes(title: string): string {
    let stripped = title
    // Strip repeatedly, a title can carry more than one suffix
    for (;;) {
        const next = stripped.replace(EDITION_SUFFIXES, "").replace(DASHED_EDITION_SUFFIXES, "")
        if (next === stripped || next.trim().length === 0) {
            return stripped.trim()
        }
        stripped = next
    }
}

/** The whole credit, followed by its first artist when it names several */
function getArtistNames(artist: string): readonly string[] {
    const [first] = artist.split(ARTIST_SEPARATORS)
    return first && first !== artist ? [artist, first] : [artist]
}

/**
 * Whether a channel is one of YouTube's generated `Artist - Topic` channels,
 * which hold album audio over a still image rather than music videos.
 */
export function isTopicChannel(channelTitle: string): boolean {
    return /\s-\sTopic$/i.test(channelTitle)
}

/**
 * Whether a channel looks like it belongs to an artist: it carries their name,
 * give or take the words labels add to it, e.g. `NirvanaVEVO` or `Nirvana Official`.
 *
 * The API does not say which channels YouTube has verified, so the name is all
 * there is to go on.
 */
export function isOfficialChannel(channelTitle: string, artist: string): boolean {
    if (isTopicChannel(channelTitle)) {
        return false
    }
    const channel = fold(channelTitle).replace(/ /g, "")
    return getArtistNames(artist).some((name) => {
        const wanted = fold(name).replace(/ /g, "")
        if (wanted.length === 0) {
            return false
        }
        let candidate = channel
        while (candidate !== wanted) {
            const next = candidate.replace(CHANNEL_SUFFIXES, "")
            if (next === candidate || next.length === 0) {
                break
            }
            candidate = next
        }
        return candidate === wanted || candidate.replace(CHANNEL_PREFIXES, "") === wanted
    })
}

function mentionsArtist(video: YouTubeVideo, artist: string): boolean {
    const title = fold(video.title)
    const channel = fold(video.channelTitle)
    return (
        isOfficialChannel(video.channelTitle, artist) ||
        getArtistNames(artist).some((name) => {
            const wanted = fold(name)
            return containsPhrase(title, wanted) || containsPhrase(channel, wanted)
        })
    )
}

/** Whether a video is of the given song, by the given artist */
function isVideoOfSong(video: YouTubeVideo, artist: string, songTitle: string): boolean {
    return (
        !isTopicChannel(video.channelTitle) &&
        containsPhrase(fold(video.title), fold(stripEditionSuffixes(songTitle))) &&
        mentionsArtist(video, artist)
    )
}

/**
 * Whether a video's title marks it as something other than the music video,
 * e.g. a lyric video or a live recording. Words the song's own title contains
 * do not count, `Live Forever` is not a live recording.
 */
function isNotTheVideo(video: YouTubeVideo, songTitle: string): boolean {
    const title = fold(video.title)
    const song = fold(songTitle)
    return NOT_THE_VIDEO_MARKERS.some(
        (marker) => containsPhrase(title, marker) && !containsPhrase(song, marker),
    )
}

function byViews(a: YouTubeVideo, b: YouTubeVideo): number {
    return b.viewCount - a.viewCount
}

/** Order by the given flags, earlier ones winning, and then by views */
function byPreference(...flags: readonly ((video: YouTubeVideo) => boolean)[]) {
    return (a: YouTubeVideo, b: YouTubeVideo): number => {
        for (const flag of flags) {
            const difference = Number(flag(b)) - Number(flag(a))
            if (difference !== 0) {
                return difference
            }
        }
        return byViews(a, b)
    }
}

/**
 * Pick the video to show for a song out of a page of search results.
 *
 * The official music video wins: one on the artist's own or VEVO channel whose
 * title does not mark it as a lyric video, live recording or the like. Without
 * one, the most viewed video of the song is used instead.
 *
 * @returns `null` when none of the videos are of the song.
 */
export function pickSongVideos(
    videos: readonly YouTubeVideo[],
    artist: string,
    songTitle: string,
): Extract<MusicVideoLookup, { kind: "official" | "popular" }> | null {
    const matches = videos.filter((video) => isVideoOfSong(video, artist, songTitle))
    if (matches.length === 0) {
        return null
    }
    const [official] = matches
        .filter(
            (video) =>
                isOfficialChannel(video.channelTitle, artist) && !isNotTheVideo(video, songTitle),
        )
        .sort(byPreference((video) => OFFICIAL_VIDEO_MARKERS.test(fold(video.title))))
    const video = official ?? [...matches].sort(byViews)[0]
    return {
        kind: official ? "official" : "popular",
        video,
        alternates: matches
            .filter((other) => other !== video)
            .sort(byViews)
            .slice(0, MAX_ALTERNATES),
    }
}

/**
 * Pick an artist's channel and videos out of a page of search results.
 *
 * The channel is the most subscribed one carrying the artist's name. Videos
 * from an official channel come first, then everything else by views.
 */
export function pickArtistVideos(
    videos: readonly YouTubeVideo[],
    channels: readonly YouTubeChannel[],
    artist: string,
): Extract<MusicVideoLookup, { kind: "artist" }> {
    const [channel = null] = channels
        .filter((channel) => isOfficialChannel(channel.title, artist))
        .sort((a, b) => (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0))
    const isOfficial = (video: YouTubeVideo) =>
        video.channelId === channel?.id || isOfficialChannel(video.channelTitle, artist)
    return {
        kind: "artist",
        channel,
        videos: videos
            .filter((video) => !isTopicChannel(video.channelTitle) && mentionsArtist(video, artist))
            .sort(byPreference(isOfficial))
            .slice(0, MAX_ARTIST_VIDEOS),
    }
}
