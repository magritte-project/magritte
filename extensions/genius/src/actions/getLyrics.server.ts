/// <reference types="node" />

import "@/actions/env"
import { z } from "zod"

const GetLyricsSchema = z.object({
    artist: z.string(),
    title: z.string(),
})

type GetLyricsParams = z.infer<typeof GetLyricsSchema>

interface GeniusSearchHit {
    type: string
    result: {
        id: number
        title: string
        url: string
        lyrics_state: string
        primary_artist: { name: string }
    }
}

interface GeniusSearchResponse {
    meta: { status: number; message?: string }
    response: { hits: GeniusSearchHit[] }
}

const BROWSER_USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"

class HttpError extends Error {
    readonly status: number
    readonly code: string

    constructor(message: string, status: number, code: string) {
        super(message)
        this.status = status
        this.code = code
    }
}

/**
 * Looks up a song on genius.com and returns its lyrics as plain text.
 *
 * The Genius API does not expose lyrics directly, so this searches the API for
 * the song and then extracts the lyrics from the song's page on genius.com.
 */
export async function getLyrics({ artist, title }: GetLyricsParams): Promise<string> {
    const accessToken = process.env["GENIUS_ACCESS_TOKEN"]
    if (!accessToken) {
        throw new HttpError("Extension not configured with credentials", 503, "NOT_CONFIGURED")
    }

    const song = await searchSong(accessToken, artist, title)
    if (!song) {
        throw new HttpError(`No lyrics found for "${title}" by ${artist}`, 404, "NOT_FOUND")
    }

    // genius.com rejects requests that don't look like they come from a browser.
    const response = await fetch(song.url, {
        headers: { Accept: "text/html", "User-Agent": BROWSER_USER_AGENT },
    })
    if (!response.ok) {
        throw new HttpError(
            `Failed to load lyrics page (${response.status})`,
            502,
            "UPSTREAM_ERROR",
        )
    }

    const lyrics = extractLyrics(await response.text())
    if (!lyrics) {
        throw new HttpError(`No lyrics found for "${title}" by ${artist}`, 404, "NOT_FOUND")
    }
    return lyrics
}

getLyrics.schema = GetLyricsSchema

async function searchSong(accessToken: string, artist: string, title: string) {
    const url = new URL("https://api.genius.com/search")
    url.searchParams.set("q", `${artist} ${title}`)

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
        throw new HttpError(`Genius search failed (${response.status})`, 502, "UPSTREAM_ERROR")
    }

    const body = (await response.json()) as GeniusSearchResponse
    const songs = body.response.hits
        .filter((hit) => hit.type === "song" && hit.result.lyrics_state === "complete")
        .map((hit) => hit.result)

    const wantedArtist = normalize(artist)
    const wantedTitle = normalize(title)
    return (
        songs.find(
            (song) =>
                normalize(song.primary_artist.name) === wantedArtist &&
                normalize(song.title) === wantedTitle,
        ) ??
        songs.find((song) => normalize(song.primary_artist.name) === wantedArtist) ??
        songs[0]
    )
}

function normalize(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
}

/**
 * Extracts plain text lyrics from a genius.com song page.
 *
 * Lyrics are split across one or more `<div data-lyrics-container="true">`
 * elements, which may contain nested markup (links for annotations, formatting,
 * and non-lyric headers marked with `data-exclude-from-selection`).
 */
function extractLyrics(html: string): string {
    const sections: string[] = []
    const containerPattern = /<div[^>]*\bdata-lyrics-container="true"[^>]*>/g
    for (let match = containerPattern.exec(html); match; match = containerPattern.exec(html)) {
        const start = match.index + match[0].length
        const end = findClosingDiv(html, start)
        sections.push(html.slice(start, end))
        containerPattern.lastIndex = end
    }

    const text = sections
        .map((section) => htmlToText(removeExcluded(section)))
        .join("\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    return text
}

/** Returns the index of the `</div>` matching a `<div>` whose contents begin at `start`. */
function findClosingDiv(html: string, start: number): number {
    const tagPattern = /<(\/?)div\b[^>]*>/gi
    tagPattern.lastIndex = start
    let depth = 1
    for (let match = tagPattern.exec(html); match; match = tagPattern.exec(html)) {
        depth += match[1] ? -1 : 1
        if (depth === 0) {
            return match.index
        }
    }
    return html.length
}

function removeExcluded(html: string): string {
    const excludedPattern = /<div[^>]*\bdata-exclude-from-selection="true"[^>]*>/i
    for (let match = excludedPattern.exec(html); match; match = excludedPattern.exec(html)) {
        const end = findClosingDiv(html, match.index + match[0].length)
        html = html.slice(0, match.index) + html.slice(end + "</div>".length)
    }
    return html
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
}

function htmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
            if (name[0] === "#") {
                const codePoint =
                    name[1] === "x" || name[1] === "X"
                        ? parseInt(name.slice(2), 16)
                        : parseInt(name.slice(1), 10)
                return String.fromCodePoint(codePoint)
            }
            return NAMED_ENTITIES[name.toLowerCase()] ?? entity
        })
}
