import type { PlayableItem } from "@magritte/sdk"

import type { RecordingSearchHit, SearchHitRelease, TrackMatch } from "@/model/types"
import { formatArtistCredit } from "@/musicbrainz/parse"
import { formatYear } from "@/utilities/format"
import {
    compareTitles,
    hasEditionSuffix,
    normalizeForMatch,
    stripEditionSuffixesForSearch,
} from "@/utilities/text"

export interface RecordingSearchQuery {
    readonly title: string
    readonly artist: string
    readonly album?: string
}

/** What to search MusicBrainz for, or null when the item is too sparse to look up */
export function buildRecordingQuery(item: PlayableItem | null): RecordingSearchQuery | null {
    const title = item?.title?.trim()
    const artist = item?.artist_name?.trim()
    if (!title || !artist) {
        return null
    }
    const album = item?.album_title?.trim()
    // Tags carry editions and guests in the title, MusicBrainz keeps those elsewhere
    return {
        title: stripEditionSuffixesForSearch(title),
        artist,
        album: album ? stripEditionSuffixesForSearch(album) : undefined,
    }
}

/** Quote a term for a Lucene query, escaping what would end the quote */
export function quoteLucene(value: string): string {
    return `"${value.replace(/[\\"]/g, "\\$&")}"`
}

export function formatLuceneQuery(
    query: RecordingSearchQuery,
    { includeAlbum = true } = {},
): string {
    const parts = [`recording:${quoteLucene(query.title)}`, `artist:${quoteLucene(query.artist)}`]
    if (includeAlbum && query.album !== undefined) {
        parts.push(`release:${quoteLucene(query.album)}`)
    }
    return parts.join(" AND ")
}

/** Where a candidate falls short of being a plausible match at all */
const MINIMUM_SCORE = 50

/**
 * Words in a recording's disambiguation which mark it as a variant of the
 * song rather than the song itself. A variant only fits when what is playing
 * says the same thing about itself.
 */
const VARIANT_WORDS = [
    "live",
    "video",
    "demo",
    "remix",
    "instrumental",
    "acoustic",
    "rehearsal",
    "radio edit",
    "edit",
    "mix",
    "version",
    "take",
    "session",
    "karaoke",
    "cover",
]

/** The variant words in some text, kept even where a title would drop them as an edition suffix */
function variantWords(text: string | null | undefined): readonly string[] {
    const plain = (text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
    return VARIANT_WORDS.filter((word) => new RegExp(`\\b${word}\\b`).test(plain))
}

/**
 * How well a recording's kind fits what is playing: a live take fits a live
 * album or a title that says live, and is otherwise the wrong recording of
 * the right song.
 */
function scoreVariant(
    hit: RecordingSearchHit,
    item: PlayableItem,
    release: SearchHitRelease | undefined,
): number {
    // Some variants are named in the title itself, e.g. `(Devonshire mix)`, which the
    // title comparison forgives as an edition suffix
    const words = variantWords(`${hit.disambiguation ?? ""} ${hit.title}`)
    if (words.length === 0) {
        return 0
    }
    // A live album vouches for a live take, but only the very album that is playing:
    // `Post Live` must not stand in for `Post`
    const albumTypes =
        release !== undefined && compareTitles(release.title, item.album_title) === 2
            ? release.releaseGroup.secondaryTypes.map((type) => type.toLowerCase())
            : []
    const wanted = new Set([
        ...variantWords(`${item.title ?? ""} ${item.album_title ?? ""}`),
        ...albumTypes,
    ])
    return words.every((word) => wanted.has(word)) ? 1 : -1.5
}

function scoreRelease(release: SearchHitRelease, item: PlayableItem): number {
    let score = compareTitles(release.title, item.album_title)
    // Reissues and box sets say so in a disambiguation or the title, the original pressing does not
    const namesEdition =
        (release.disambiguation !== undefined &&
            compareTitles(release.disambiguation, item.album_title) === 0) ||
        (hasEditionSuffix(release.title) && !hasEditionSuffix(item.album_title))
    if (namesEdition) {
        score -= 0.25
    }
    if (release.status === "Official") {
        score += 0.5
    }
    if (
        release.releaseGroup.primaryType === "Album" &&
        release.releaseGroup.secondaryTypes.length === 0
    ) {
        score += 0.5
    }
    if (
        item.track_number != null &&
        release.media.some((medium) => Number(medium.trackNumber) === item.track_number)
    ) {
        score += 0.5
    }
    return score
}

function scoreArtist(hit: RecordingSearchHit, item: PlayableItem): number {
    const wanted = normalizeForMatch(item.artist_name)
    if (wanted.length === 0) {
        return 0
    }
    const names = [
        formatArtistCredit(hit.artistCredit),
        ...hit.artistCredit.flatMap((part) => [part.name, part.artist.name]),
    ].map(normalizeForMatch)
    if (names.includes(wanted)) {
        return 1
    }
    return names.some((name) => name.includes(wanted) || wanted.includes(name)) ? 0.5 : 0
}

function scoreLength(hit: RecordingSearchHit, item: PlayableItem): number {
    if (hit.lengthMs === undefined) {
        return 0
    }
    // Like the host, a missing start time means the item plays from the beginning
    const playingSeconds = item.end_time - (item.start_time ?? 0)
    return Math.abs(playingSeconds - hit.lengthMs / 1000) <= 3 ? 0.5 : 0
}

/**
 * Whether the recording first came out the year the playing item says it did.
 * One that first appeared later cannot be what is on the record, which rules
 * out the live takes and remixes that reissues add.
 */
function scoreDate(hit: RecordingSearchHit, item: PlayableItem): number {
    const wanted = Number(formatYear(item.release_date))
    const actual = Number(formatYear(hit.firstReleaseDate))
    if (!Number.isFinite(wanted) || !Number.isFinite(actual)) {
        return 0
    }
    return actual === wanted ? 0.5 : actual > wanted ? -1 : 0
}

interface Candidate {
    readonly hit: RecordingSearchHit
    readonly release: SearchHitRelease | undefined
    readonly releaseScore: number
    readonly total: number
}

function earliestDate(release: SearchHitRelease | undefined): string {
    return release?.date ?? "9999"
}

/**
 * Choose the recording that best fits what is playing.
 *
 * MusicBrainz's own score is a weak signal on its own: many recordings tie at
 * 100, including music videos and re-recordings, so the album title, release
 * status, track number and length are what usually settle it.
 */
export function chooseRecordingMatch(
    hits: readonly RecordingSearchHit[],
    item: PlayableItem,
): TrackMatch | null {
    // Music videos are separate recordings, and a live take or remix nobody asked
    // for would show the wrong credits, so neither is ever a match
    const plausible = hits.filter((hit) => hit.score >= MINIMUM_SCORE && !hit.video)
    const candidates = plausible.flatMap((hit): Candidate[] => {
        let release: SearchHitRelease | undefined
        let releaseScore = 0
        for (const candidate of hit.releases) {
            const score = scoreRelease(candidate, item)
            if (
                release === undefined ||
                score > releaseScore ||
                (score === releaseScore && earliestDate(candidate) < earliestDate(release))
            ) {
                release = candidate
                releaseScore = score
            }
        }
        // Relevance separates the plausible from the rest, it does not rank the plausible
        const variantScore = scoreVariant(hit, item, release)
        if (variantScore < 0) {
            return []
        }
        const total =
            hit.score / 200 +
            compareTitles(hit.title, item.title) +
            scoreArtist(hit, item) +
            releaseScore +
            scoreLength(hit, item) +
            variantScore +
            scoreDate(hit, item)
        return [{ hit, release, releaseScore, total }]
    })
    // All else being equal, the original recording came out first
    candidates.sort(
        (a, b) =>
            b.total - a.total ||
            b.hit.score - a.hit.score ||
            (a.hit.firstReleaseDate ?? "9999").localeCompare(b.hit.firstReleaseDate ?? "9999") ||
            earliestDate(a.release).localeCompare(earliestDate(b.release)),
    )
    const best = candidates[0]
    if (best === undefined) {
        return null
    }
    // Prefer the credited artist whose name matches over whoever is listed first
    const wanted = normalizeForMatch(item.artist_name)
    const artistPart =
        best.hit.artistCredit.find((part) => normalizeForMatch(part.artist.name) === wanted) ??
        best.hit.artistCredit.find((part) => normalizeForMatch(part.name) === wanted) ??
        best.hit.artistCredit[0]
    if (artistPart === undefined) {
        return null
    }
    return {
        recording: { id: best.hit.id, name: best.hit.title },
        artist: artistPart.artist,
        release: best.release ? { id: best.release.id, name: best.release.title } : undefined,
        releaseGroup: best.release
            ? { id: best.release.releaseGroup.id, name: best.release.releaseGroup.title }
            : undefined,
        albumMatched: compareTitles(best.release?.title, item.album_title) >= 1,
    }
}
