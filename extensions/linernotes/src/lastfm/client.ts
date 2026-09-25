import type { LastfmAlbumInfo, LastfmArtistInfo, LastfmTrackInfo, Prose } from "@/model/types"
import { extractReadMoreUrl, htmlToText, stripReadMoreTail } from "@/utilities/html"

const API_ROOT = "https://ws.audioscrobbler.com/2.0/"

/**
 * The error codes Last.fm documents which this extension reacts to.
 *
 * See <https://www.last.fm/api/errorcodes>.
 */
export const enum LastfmErrorCode {
    invalidParameters = 6,
    invalidApiKey = 10,
    serviceOffline = 11,
    temporaryError = 16,
    rateLimited = 29,
}

export class LastfmError extends Error {
    constructor(
        readonly code: number,
        message: string,
    ) {
        super(message)
        this.name = "LastfmError"
    }
}

/** Raised when the network, rather than Last.fm, is what failed */
export class LastfmNetworkError extends Error {
    constructor(cause: unknown) {
        super("Could not reach Last.fm", { cause })
        this.name = "LastfmNetworkError"
    }
}

export interface LastfmClientOptions {
    readonly apiKey: string
    /** Overridable so tests do not have to touch the network */
    readonly fetch?: typeof globalThis.fetch
}

/** Who to look up: an artist's MusicBrainz id is accepted directly */
export type LastfmArtistLookup = { readonly mbid: string } | { readonly name: string }

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
    return Array.isArray(value) ? value : value ? [value] : []
}

function parseTags(raw: any): readonly string[] {
    return asList(raw?.tag).flatMap((tag) => asString(tag?.name) ?? [])
}

/** Last.fm returns images smallest first, the last one is the largest available */
function getImageUrl(images: unknown): string | undefined {
    if (!Array.isArray(images)) {
        return undefined
    }
    for (let i = images.length - 1; i >= 0; i--) {
        const url = images[i]?.["#text"]
        if (typeof url === "string" && url.length > 0) {
            return url
        }
    }
    return undefined
}

/**
 * Last.fm bios and wikis are HTML fragments ending in a `Read more` link. The
 * longer `content` is preferred over `summary` when it has more to say.
 */
export function parseProse(raw: any, fallbackUrl: string): Prose | null {
    const summary = asString(raw?.summary) ?? ""
    const content = asString(raw?.content) ?? ""
    const html = stripReadMoreTail(content.length > summary.length ? content : summary)
    const text = htmlToText(html)
    if (text.length === 0) {
        return null
    }
    return {
        source: "lastfm",
        text,
        sourceUrl: extractReadMoreUrl(summary) ?? extractReadMoreUrl(content) ?? fallbackUrl,
    }
}

export class LastfmClient {
    private readonly _apiKey: string
    private readonly _fetch: typeof globalThis.fetch

    constructor({ apiKey, fetch = globalThis.fetch }: LastfmClientOptions) {
        this._apiKey = apiKey
        // Bound so the default `fetch` is not called with the wrong receiver
        this._fetch = fetch.bind(globalThis)
    }

    /** Whether the extension was built with a Last.fm API key */
    get hasCredentials(): boolean {
        return this._apiKey.length > 0
    }

    private async _call(
        method: string,
        parameters: Readonly<Record<string, string | undefined>>,
    ): Promise<any> {
        const query = new URLSearchParams({ method, api_key: this._apiKey, format: "json" })
        for (const [name, value] of Object.entries(parameters)) {
            if (value !== undefined) {
                query.set(name, value)
            }
        }
        let response: Response
        try {
            response = await this._fetch(`${API_ROOT}?${query}`, { method: "GET" })
        } catch (error) {
            throw new LastfmNetworkError(error)
        }
        // Last.fm reports its own errors as JSON, including on 4xx responses
        const payload = await response.json().catch(() => null)
        if (payload !== null && typeof payload.error === "number") {
            throw new LastfmError(payload.error, String(payload.message ?? "Last.fm call failed"))
        }
        if (!response.ok) {
            throw new LastfmError(-1, `Last.fm responded with ${response.status}`)
        }
        return payload
    }

    /** Run a lookup, treating "not found" as an empty result rather than a failure */
    private async _lookup(
        method: string,
        parameters: Readonly<Record<string, string | undefined>>,
    ): Promise<any | null> {
        try {
            return await this._call(method, { ...parameters, autocorrect: "1" })
        } catch (error) {
            if (error instanceof LastfmError && error.code === LastfmErrorCode.invalidParameters) {
                return null
            }
            throw error
        }
    }

    async getArtistInfo(lookup: LastfmArtistLookup): Promise<LastfmArtistInfo | null> {
        const payload = await this._lookup(
            "artist.getInfo",
            "mbid" in lookup ? { mbid: lookup.mbid } : { artist: lookup.name },
        )
        const artist = payload?.artist
        const name = asString(artist?.name)
        if (name === undefined) {
            return null
        }
        const url = asString(artist?.url) ?? ""
        return {
            name,
            url,
            stats: {
                listeners: asNumber(artist?.stats?.listeners) ?? 0,
                playCount: asNumber(artist?.stats?.playcount) ?? 0,
            },
            tags: parseTags(artist?.tags),
            similar: asList(artist?.similar?.artist).flatMap((similar) => {
                const similarName = asString(similar?.name)
                return similarName !== undefined
                    ? [{ name: similarName, url: asString(similar?.url) ?? "" }]
                    : []
            }),
            bio: parseProse(artist?.bio, url),
        }
    }

    async getAlbumInfo(artist: string, album: string): Promise<LastfmAlbumInfo | null> {
        const payload = await this._lookup("album.getInfo", { artist, album })
        const raw = payload?.album
        const name = asString(raw?.name)
        if (name === undefined) {
            return null
        }
        const url = asString(raw?.url) ?? ""
        return {
            name,
            artist: asString(raw?.artist) ?? artist,
            url,
            stats: {
                listeners: asNumber(raw?.listeners) ?? 0,
                playCount: asNumber(raw?.playcount) ?? 0,
            },
            tags: parseTags(raw?.tags),
            tracks: asList(raw?.tracks?.track).flatMap((track, index) => {
                const trackName = asString(track?.name)
                return trackName !== undefined
                    ? [
                          {
                              rank: asNumber(track?.["@attr"]?.rank) ?? index + 1,
                              name: trackName,
                              // Album track durations are in seconds, unlike track.getInfo
                              durationSec: asNumber(track?.duration),
                          },
                      ]
                    : []
            }),
            wiki: parseProse(raw?.wiki, url),
            imageUrl: getImageUrl(raw?.image),
        }
    }

    async getTrackInfo(artist: string, track: string): Promise<LastfmTrackInfo | null> {
        const payload = await this._lookup("track.getInfo", { artist, track })
        const raw = payload?.track
        const name = asString(raw?.name)
        if (name === undefined) {
            return null
        }
        const url = asString(raw?.url) ?? ""
        const durationMs = asNumber(raw?.duration)
        return {
            name,
            artist: asString(raw?.artist?.name) ?? artist,
            url,
            durationMs: durationMs !== undefined && durationMs > 0 ? durationMs : undefined,
            stats: {
                listeners: asNumber(raw?.listeners) ?? 0,
                playCount: asNumber(raw?.playcount) ?? 0,
            },
            tags: parseTags(raw?.toptags),
            wiki: parseProse(raw?.wiki, url),
        }
    }
}
