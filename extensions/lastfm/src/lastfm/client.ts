import { md5 } from "@/lastfm/md5"

const API_ROOT = "https://ws.audioscrobbler.com/2.0/"

/** The page the user approves a request token on */
const AUTH_ROOT = "https://www.last.fm/api/auth/"

/**
 * The error codes Last.fm documents which this extension reacts to.
 *
 * See <https://www.last.fm/api/errorcodes>.
 */
export const enum LastfmErrorCode {
    invalidSessionKey = 9,
    invalidApiKey = 10,
    serviceOffline = 11,
    invalidMethodSignature = 13,
    unauthorizedToken = 14,
    expiredToken = 15,
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

    /** Whether retrying the same call later could plausibly succeed */
    get isTransient(): boolean {
        switch (this.code) {
            case LastfmErrorCode.serviceOffline:
            case LastfmErrorCode.temporaryError:
            case LastfmErrorCode.rateLimited:
                return true
            default:
                return false
        }
    }
}

/** Raised when the network, rather than Last.fm, is what failed */
export class LastfmNetworkError extends Error {
    constructor(cause: unknown) {
        super("Could not reach Last.fm", { cause })
        this.name = "LastfmNetworkError"
    }
}

export type LastfmParameters = Readonly<Record<string, string | number | undefined>>

/** Drop unset parameters and stringify the rest, the shape every other step expects */
function normalizeParameters(parameters: LastfmParameters): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const [name, value] of Object.entries(parameters)) {
        if (value !== undefined) {
            normalized[name] = String(value)
        }
    }
    return normalized
}

/**
 * Sign a set of parameters the way Last.fm requires: every parameter except
 * `format` and `api_sig` itself, sorted by name, concatenated as `nameValue`
 * pairs, followed by the shared secret, then hashed.
 *
 * See <https://www.last.fm/api/authspec#_8-signing-calls>.
 */
export function signParameters(parameters: LastfmParameters, apiSecret: string): string {
    const normalized = normalizeParameters(parameters)
    const signable = Object.keys(normalized)
        .filter((name) => name !== "format" && name !== "api_sig")
        .sort()
        .map((name) => `${name}${normalized[name]}`)
        .join("")
    return md5(`${signable}${apiSecret}`)
}

export interface LastfmSession {
    /** The session key used to sign authenticated calls */
    readonly key: string

    /** The name of the account the session belongs to */
    readonly name: string

    /** Whether the account is a Last.fm subscriber */
    readonly subscriber: boolean
}

export interface LastfmTrack {
    readonly name: string
    readonly artist: string
    readonly album?: string
    readonly url?: string
    readonly imageUrl?: string
    /** Unix time in seconds, absent for the currently playing track */
    readonly scrobbledAt?: number
    /** Whether Last.fm reports this track as playing right now */
    readonly isNowPlaying: boolean
    /** How many times the user has played the track, only present in chart responses */
    readonly playCount?: number
}

export interface Scrobble {
    readonly artist: string
    readonly track: string
    readonly album?: string
    readonly albumArtist?: string
    readonly trackNumber?: number
    /** Length of the track in seconds */
    readonly duration?: number
    /** When the track started playing, as unix time in seconds */
    readonly timestamp: number
}

/** The periods `user.getTopTracks` accepts which this extension exposes */
export type TopTracksPeriod = "7day" | "1month"

export interface LastfmClientOptions {
    readonly apiKey: string
    readonly apiSecret: string
    /** Overridable so tests do not have to touch the network */
    readonly fetch?: typeof globalThis.fetch
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

function parseTrack(raw: any): LastfmTrack {
    // `artist` is an object for user.getRecentTracks and user.getTopTracks,
    // but a bare string in some other responses
    const artist =
        typeof raw?.artist === "string"
            ? raw.artist
            : (raw?.artist?.name ?? raw?.artist?.["#text"] ?? "")
    const playCount = Number(raw?.playcount)
    return {
        name: String(raw?.name ?? ""),
        artist,
        album: raw?.album?.["#text"] || raw?.album?.title || undefined,
        url: typeof raw?.url === "string" ? raw.url : undefined,
        imageUrl: getImageUrl(raw?.image),
        scrobbledAt: raw?.date?.uts !== undefined ? Number(raw.date.uts) : undefined,
        isNowPlaying: raw?.["@attr"]?.nowplaying === "true",
        playCount: Number.isFinite(playCount) ? playCount : undefined,
    }
}

export class LastfmClient {
    private readonly _apiKey: string
    private readonly _apiSecret: string
    private readonly _fetch: typeof globalThis.fetch

    constructor({ apiKey, apiSecret, fetch = globalThis.fetch }: LastfmClientOptions) {
        this._apiKey = apiKey
        this._apiSecret = apiSecret
        // Bound so the default `fetch` is not called with the wrong receiver
        this._fetch = fetch.bind(globalThis)
    }

    /** Whether the extension was built with Last.fm credentials */
    get hasCredentials(): boolean {
        return this._apiKey.length > 0 && this._apiSecret.length > 0
    }

    private async _call(
        method: string,
        parameters: LastfmParameters,
        { sign = false, post = false }: { sign?: boolean; post?: boolean } = {},
    ): Promise<any> {
        const normalized = normalizeParameters({
            ...parameters,
            method,
            api_key: this._apiKey,
        })
        if (sign) {
            normalized.api_sig = signParameters(normalized, this._apiSecret)
        }
        // `format` is excluded from the signature, so it goes on afterwards
        normalized.format = "json"

        const body = new URLSearchParams(normalized)
        let response: Response
        try {
            response = post
                ? await this._fetch(API_ROOT, {
                      method: "POST",
                      // A simple request, so the browser does not need to preflight it
                      headers: { "Content-Type": "application/x-www-form-urlencoded" },
                      body,
                  })
                : await this._fetch(`${API_ROOT}?${body}`, { method: "GET" })
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

    /** Request a token for the user to approve */
    async getToken(): Promise<string> {
        const payload = await this._call("auth.getToken", {}, { sign: true })
        const token = payload?.token
        if (typeof token !== "string") {
            throw new LastfmError(-1, "Last.fm did not return a request token")
        }
        return token
    }

    /** The URL the user approves a request token at */
    getAuthorizationUrl(token: string): string {
        const url = new URL(AUTH_ROOT)
        url.searchParams.set("api_key", this._apiKey)
        url.searchParams.set("token", token)
        return url.toString()
    }

    /**
     * Exchange an approved token for a session.
     *
     * Throws a {@link LastfmError} with {@link LastfmErrorCode.unauthorizedToken}
     * until the user has approved the token.
     */
    async getSession(token: string): Promise<LastfmSession> {
        const payload = await this._call("auth.getSession", { token }, { sign: true })
        const session = payload?.session
        if (typeof session?.key !== "string") {
            throw new LastfmError(-1, "Last.fm did not return a session")
        }
        return {
            key: session.key,
            name: String(session.name ?? ""),
            subscriber: session.subscriber === 1 || session.subscriber === "1",
        }
    }

    /** Tell Last.fm what is playing right now, which is not itself a scrobble */
    async updateNowPlaying(
        scrobble: Omit<Scrobble, "timestamp">,
        sessionKey: string,
    ): Promise<void> {
        await this._call(
            "track.updateNowPlaying",
            {
                artist: scrobble.artist,
                track: scrobble.track,
                album: scrobble.album,
                albumArtist: scrobble.albumArtist,
                trackNumber: scrobble.trackNumber,
                duration:
                    scrobble.duration !== undefined ? Math.round(scrobble.duration) : undefined,
                sk: sessionKey,
            },
            { sign: true, post: true },
        )
    }

    /**
     * Submit up to 50 scrobbles in one call.
     *
     * @returns The scrobbles Last.fm rejected, paired with the reason why.
     */
    async scrobble(
        scrobbles: readonly Scrobble[],
        sessionKey: string,
    ): Promise<readonly { scrobble: Scrobble; message: string }[]> {
        if (scrobbles.length === 0) {
            return []
        }
        if (scrobbles.length > 50) {
            throw new Error("Last.fm accepts at most 50 scrobbles per call")
        }
        const parameters: Record<string, string | number | undefined> = { sk: sessionKey }
        scrobbles.forEach((scrobble, index) => {
            parameters[`artist[${index}]`] = scrobble.artist
            parameters[`track[${index}]`] = scrobble.track
            parameters[`timestamp[${index}]`] = scrobble.timestamp
            parameters[`album[${index}]`] = scrobble.album
            parameters[`albumArtist[${index}]`] = scrobble.albumArtist
            parameters[`trackNumber[${index}]`] = scrobble.trackNumber
            parameters[`duration[${index}]`] =
                scrobble.duration !== undefined ? Math.round(scrobble.duration) : undefined
        })
        const payload = await this._call("track.scrobble", parameters, { sign: true, post: true })
        // A single scrobble comes back as an object, several come back as an array
        const rawResults = payload?.scrobbles?.scrobble
        const results = Array.isArray(rawResults) ? rawResults : rawResults ? [rawResults] : []
        const ignored: { scrobble: Scrobble; message: string }[] = []
        results.forEach((result: any, index: number) => {
            const ignoredMessage = result?.ignoredMessage
            const code = Number(ignoredMessage?.code ?? 0)
            if (code !== 0 && scrobbles[index] !== undefined) {
                ignored.push({
                    scrobble: scrobbles[index],
                    message: String(ignoredMessage?.["#text"] || `Ignored with code ${code}`),
                })
            }
        })
        return ignored
    }

    /** The tracks a user most recently scrobbled, newest first */
    async getRecentTracks(user: string, limit = 25): Promise<readonly LastfmTrack[]> {
        const payload = await this._call("user.getRecentTracks", { user, limit })
        const rawTracks = payload?.recenttracks?.track
        const tracks = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : []
        return tracks.map(parseTrack)
    }

    /** The tracks a user played most over a period, most played first */
    async getTopTracks(
        user: string,
        period: TopTracksPeriod,
        limit = 25,
    ): Promise<readonly LastfmTrack[]> {
        const payload = await this._call("user.getTopTracks", { user, period, limit })
        const rawTracks = payload?.toptracks?.track
        const tracks = Array.isArray(rawTracks) ? rawTracks : rawTracks ? [rawTracks] : []
        return tracks.map(parseTrack)
    }
}
