import type { YouTubeChannel, YouTubeVideo } from "@/youtube/types"

const API_ROOT = "https://www.googleapis.com/youtube/v3"

const VIDEO_PARTS = "snippet,contentDetails,statistics,status"

/** The id of YouTube's Music category */
const MUSIC_CATEGORY_ID = "10"

/** The most ids `videos.list` and `channels.list` accept in one call */
const MAX_IDS_PER_CALL = 50

export class YouTubeError extends Error {
    constructor(
        readonly status: number,
        /** YouTube's own name for what went wrong, e.g. `quotaExceeded` */
        readonly reason: string | undefined,
        message: string,
    ) {
        super(message)
        this.name = "YouTubeError"
    }

    /** Whether the API key has used up its searches for the day */
    get isQuotaExceeded(): boolean {
        return this.reason === "quotaExceeded" || this.reason === "dailyLimitExceeded"
    }
}

/** Raised when the network, rather than YouTube, is what failed */
export class YouTubeNetworkError extends Error {
    constructor(cause: unknown) {
        super("Could not reach YouTube", { cause })
        this.name = "YouTubeNetworkError"
    }
}

export interface YouTubeClientOptions {
    readonly apiKey: string
    /** Overridable so tests do not have to touch the network */
    readonly fetch?: typeof globalThis.fetch
}

export interface YouTubeSearchOptions {
    readonly query: string
    readonly types: readonly ("video" | "channel")[]
    readonly maxResults: number
}

export interface YouTubePopularOptions {
    readonly regionCode?: string
    readonly maxResults: number
}

export interface YouTubeSearchResults {
    readonly videoIds: readonly string[]
    readonly channelIds: readonly string[]
}

function asNumber(value: unknown): number | undefined {
    const number = Number(value)
    return value !== undefined && value !== null && value !== "" && Number.isFinite(number)
        ? number
        : undefined
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined
}

function asList(value: unknown): readonly any[] {
    return Array.isArray(value) ? value : []
}

function getThumbnailUrl(thumbnails: any): string | undefined {
    return asString((thumbnails?.medium ?? thumbnails?.high ?? thumbnails?.default)?.url)
}

function parseVideo(item: any): YouTubeVideo | [] {
    const id = asString(item?.id)
    const channelId = asString(item?.snippet?.channelId)
    if (id === undefined || channelId === undefined) {
        return []
    }
    return {
        id,
        title: asString(item.snippet.title) ?? "",
        channelId,
        channelTitle: asString(item.snippet.channelTitle) ?? "",
        thumbnailUrl: getThumbnailUrl(item.snippet.thumbnails),
        durationSec: parseDuration(item.contentDetails?.duration),
        publishedAt: asString(item.snippet.publishedAt),
        viewCount: asNumber(item.statistics?.viewCount) ?? 0,
        embeddable: item.status?.embeddable !== false,
    }
}

/** The seconds in an ISO 8601 duration such as `PT4M13S`, as YouTube reports them */
export function parseDuration(duration: unknown): number | undefined {
    const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
        asString(duration) ?? "",
    )
    if (!match) {
        return undefined
    }
    const [days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0))
    return days * 86_400 + hours * 3600 + minutes * 60 + seconds
}

/**
 * A client for the parts of the YouTube Data API this extension reads.
 *
 * See <https://developers.google.com/youtube/v3/docs>.
 */
export class YouTubeClient {
    private readonly _apiKey: string
    private readonly _fetch: typeof globalThis.fetch

    constructor({ apiKey, fetch = globalThis.fetch }: YouTubeClientOptions) {
        this._apiKey = apiKey
        // Bound so the default `fetch` is not called with the wrong receiver
        this._fetch = fetch.bind(globalThis)
    }

    /** Whether the extension was built with a YouTube API key */
    get hasCredentials(): boolean {
        return this._apiKey.length > 0
    }

    private async _call(resource: string, parameters: Readonly<Record<string, string>>) {
        const query = new URLSearchParams({ ...parameters, key: this._apiKey })
        let response: Response
        try {
            response = await this._fetch(`${API_ROOT}/${resource}?${query}`, { method: "GET" })
        } catch (error) {
            throw new YouTubeNetworkError(error)
        }
        const payload = await response.json().catch(() => null)
        if (!response.ok || payload === null) {
            throw new YouTubeError(
                response.status,
                asString(payload?.error?.errors?.[0]?.reason),
                asString(payload?.error?.message) ?? `YouTube responded with ${response.status}`,
            )
        }
        return payload
    }

    private async _list(resource: string, part: string, ids: readonly string[]) {
        const items: any[] = []
        for (let start = 0; start < ids.length; start += MAX_IDS_PER_CALL) {
            const payload = await this._call(resource, {
                part,
                id: ids.slice(start, start + MAX_IDS_PER_CALL).join(","),
                maxResults: String(MAX_IDS_PER_CALL),
            })
            items.push(...asList(payload.items))
        }
        return items
    }

    /**
     * Search for videos and channels, most relevant first.
     *
     * Only ids are returned: a search result's details are abbreviated and
     * HTML-escaped, so they are better read with `getVideos` and `getChannels`.
     * This is by far the most expensive call, at 100 quota units each.
     */
    async search({
        query,
        types,
        maxResults,
    }: YouTubeSearchOptions): Promise<YouTubeSearchResults> {
        const payload = await this._call("search", {
            part: "snippet",
            fields: "items(id)",
            q: query,
            type: types.join(","),
            maxResults: String(maxResults),
        })
        const ids = asList(payload.items).map((item) => item?.id)
        return {
            videoIds: ids.flatMap((id) => asString(id?.videoId) ?? []),
            channelIds: ids.flatMap((id) => asString(id?.channelId) ?? []),
        }
    }

    async getVideos(ids: readonly string[]): Promise<readonly YouTubeVideo[]> {
        const items = await this._list("videos", VIDEO_PARTS, ids)
        return items.flatMap(parseVideo)
    }

    /**
     * The music videos being watched the most right now.
     *
     * @param regionCode The country to chart, as an ISO 3166-1 alpha-2 code.
     *     YouTube charts the United States when none is given.
     */
    async getPopularMusicVideos({
        regionCode,
        maxResults,
    }: YouTubePopularOptions): Promise<readonly YouTubeVideo[]> {
        const payload = await this._call("videos", {
            part: VIDEO_PARTS,
            chart: "mostPopular",
            videoCategoryId: MUSIC_CATEGORY_ID,
            maxResults: String(maxResults),
            ...(regionCode ? { regionCode } : {}),
        })
        return asList(payload.items).flatMap(parseVideo)
    }

    /** The ids of the videos in a playlist, in its own order */
    async getPlaylistVideoIds(playlistId: string, maxResults: number): Promise<readonly string[]> {
        let payload: any
        try {
            payload = await this._call("playlistItems", {
                part: "contentDetails",
                playlistId,
                maxResults: String(maxResults),
            })
        } catch (error) {
            // A channel which has never uploaded anything has no uploads playlist
            if (error instanceof YouTubeError && error.status === 404) {
                return []
            }
            throw error
        }
        return asList(payload.items).flatMap(
            (item) => asString(item?.contentDetails?.videoId) ?? [],
        )
    }

    async getChannels(ids: readonly string[]): Promise<readonly YouTubeChannel[]> {
        const items = await this._list("channels", "snippet,statistics,contentDetails", ids)
        return items.flatMap((item): YouTubeChannel | [] => {
            const id = asString(item?.id)
            if (id === undefined) {
                return []
            }
            return {
                id,
                title: asString(item.snippet?.title) ?? "",
                thumbnailUrl: getThumbnailUrl(item.snippet?.thumbnails),
                subscriberCount: item.statistics?.hiddenSubscriberCount
                    ? undefined
                    : asNumber(item.statistics?.subscriberCount),
                handle: asString(item.snippet?.customUrl),
                description: asString(item.snippet?.description),
                videoCount: asNumber(item.statistics?.videoCount),
                uploadsPlaylistId: asString(item.contentDetails?.relatedPlaylists?.uploads),
            }
        })
    }
}
