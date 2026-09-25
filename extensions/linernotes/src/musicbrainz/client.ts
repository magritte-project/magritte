import type {
    Artist,
    Recording,
    RecordingSearchHit,
    Release,
    ReleaseGroup,
    ReleaseGroupSummary,
} from "@/model/types"
import { formatLuceneQuery, type RecordingSearchQuery } from "@/musicbrainz/match"
import {
    MUSICBRAINZ_ROOT,
    parseArtist,
    parseRecording,
    parseRecordingSearch,
    parseRelease,
    parseReleaseGroup,
    parseReleaseGroupBrowse,
} from "@/musicbrainz/parse"
import { RateLimiter } from "@/musicbrainz/rateLimiter"

const API_ROOT = "https://musicbrainz.org/ws/2/"

/** MusicBrainz allows one request per second per client */
const REQUEST_INTERVAL_MS = 1000

/** How many pages of an artist's release groups are worth fetching */
const MAX_BROWSE_PAGES = 5
const BROWSE_PAGE_SIZE = 100

export class MusicBrainzError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message)
        this.name = "MusicBrainzError"
    }

    get isNotFound(): boolean {
        return this.status === 404
    }
}

/** Raised when the network, rather than MusicBrainz, is what failed */
export class MusicBrainzNetworkError extends Error {
    constructor(cause: unknown) {
        super("Could not reach MusicBrainz", { cause })
        this.name = "MusicBrainzNetworkError"
    }
}

export interface MusicBrainzClientOptions {
    /** Overridable so tests do not have to touch the network */
    readonly fetch?: typeof globalThis.fetch
    /** Shared so that every caller in the extension stays within the rate limit together */
    readonly limiter?: RateLimiter
}

export class MusicBrainzClient {
    private readonly _fetch: typeof globalThis.fetch
    private readonly _limiter: RateLimiter

    constructor({ fetch = globalThis.fetch, limiter }: MusicBrainzClientOptions = {}) {
        // Bound so the default `fetch` is not called with the wrong receiver
        this._fetch = fetch.bind(globalThis)
        this._limiter = limiter ?? new RateLimiter({ intervalMs: REQUEST_INTERVAL_MS })
    }

    static artistUrl(id: string): string {
        return `${MUSICBRAINZ_ROOT}/artist/${id}`
    }

    static releaseGroupUrl(id: string): string {
        return `${MUSICBRAINZ_ROOT}/release-group/${id}`
    }

    static releaseUrl(id: string): string {
        return `${MUSICBRAINZ_ROOT}/release/${id}`
    }

    static recordingUrl(id: string): string {
        return `${MUSICBRAINZ_ROOT}/recording/${id}`
    }

    /** Where to look by hand when nothing matched */
    static searchUrl(query: string): string {
        const url = new URL(`${MUSICBRAINZ_ROOT}/search`)
        url.searchParams.set("type", "recording")
        url.searchParams.set("method", "indexed")
        url.searchParams.set("query", query)
        return url.toString()
    }

    private async _get(path: string, parameters: Record<string, string>): Promise<any> {
        const url = new URL(path, API_ROOT)
        for (const [name, value] of Object.entries(parameters)) {
            url.searchParams.set(name, value)
        }
        url.searchParams.set("fmt", "json")

        const request = () =>
            this._limiter.schedule(async () => {
                try {
                    return await this._fetch(url, {
                        method: "GET",
                        headers: { Accept: "application/json" },
                    })
                } catch (error) {
                    throw new MusicBrainzNetworkError(error)
                }
            })
        let response = await request()
        // A 503 means the rate limit was hit, which one more turn in the queue clears
        if (response.status === 503) {
            response = await request()
        }
        if (!response.ok) {
            throw new MusicBrainzError(
                response.status,
                `MusicBrainz responded with ${response.status}`,
            )
        }
        return await response.json()
    }

    /** Find recordings by title and artist, narrowed by album when the query names one */
    async searchRecordings(
        query: RecordingSearchQuery,
        limit = 25,
    ): Promise<readonly RecordingSearchHit[]> {
        const payload = await this._get("recording", {
            query: formatLuceneQuery(query),
            limit: String(limit),
        })
        return parseRecordingSearch(payload)
    }

    async getArtist(id: string): Promise<Artist> {
        return parseArtist(
            await this._get(`artist/${id}`, { inc: "url-rels+tags+genres+artist-rels" }),
        )
    }

    async getReleaseGroup(id: string): Promise<ReleaseGroup> {
        return parseReleaseGroup(
            await this._get(`release-group/${id}`, {
                inc: "url-rels+releases+artist-credits+tags+genres",
            }),
        )
    }

    /**
     * A release with its tracks and everyone credited on them. Work-level
     * relationships carry the writers, and MusicBrainz only includes them
     * alongside work relationships and recording-level relationships.
     */
    async getRelease(id: string): Promise<Release> {
        return parseRelease(
            await this._get(`release/${id}`, {
                inc: "artist-credits+labels+recordings+release-groups+artist-rels+recording-level-rels+work-level-rels+work-rels+url-rels",
            }),
        )
    }

    async getRecording(id: string): Promise<Recording> {
        return parseRecording(
            await this._get(`recording/${id}`, {
                inc: "artist-credits+artist-rels+work-rels+work-level-rels+isrcs+url-rels",
            }),
        )
    }

    /**
     * The albums and EPs an artist released. Lookups cap embedded lists at 25,
     * so this browses in pages instead.
     */
    async browseReleaseGroups(artistId: string): Promise<readonly ReleaseGroupSummary[]> {
        const releaseGroups: ReleaseGroupSummary[] = []
        for (let page = 0; page < MAX_BROWSE_PAGES; page++) {
            const { total, releaseGroups: pageOfGroups } = parseReleaseGroupBrowse(
                await this._get("release-group", {
                    artist: artistId,
                    type: "album|ep",
                    limit: String(BROWSE_PAGE_SIZE),
                    offset: String(page * BROWSE_PAGE_SIZE),
                }),
            )
            releaseGroups.push(...pageOfGroups)
            if (pageOfGroups.length === 0 || releaseGroups.length >= total) {
                break
            }
        }
        return releaseGroups
    }
}
