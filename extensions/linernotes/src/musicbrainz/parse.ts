import type {
    Artist,
    ArtistCreditPart,
    EntityRef,
    Label,
    Medium,
    Membership,
    Recording,
    RecordingSearchHit,
    Relation,
    RelationTarget,
    Release,
    ReleaseGroup,
    ReleaseGroupSummary,
    ReleaseSummary,
    SearchHitRelease,
    Tag,
    Track,
    Work,
} from "@/model/types"
import { formatAttribute } from "@/musicbrainz/credits"
import { extractLinks } from "@/musicbrainz/links"

/*
 * Everything here turns MusicBrainz's JSON into the extension's own model. The
 * raw payloads are treated as untrusted and every field is optional, in the
 * same spirit as the Last.fm extension's parsing.
 */

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asArray(value: unknown): readonly any[] {
    return Array.isArray(value) ? value : []
}

function parseEntityRef(raw: any): EntityRef | undefined {
    const id = asString(raw?.id)
    if (id === undefined) {
        return undefined
    }
    return { id, name: asString(raw?.name) ?? asString(raw?.title) ?? "" }
}

export function parseArtistCredit(raw: unknown): readonly ArtistCreditPart[] {
    return asArray(raw).flatMap((part): ArtistCreditPart[] => {
        const artist = parseEntityRef(part?.artist)
        if (artist === undefined) {
            return []
        }
        return [
            {
                name: asString(part?.name) ?? artist.name,
                joinPhrase: typeof part?.joinphrase === "string" ? part.joinphrase : "",
                artist,
            },
        ]
    })
}

/** The artist credit as it would be printed, e.g. `Simon & Garfunkel` */
export function formatArtistCredit(credit: readonly ArtistCreditPart[]): string {
    return credit.map((part) => `${part.name}${part.joinPhrase}`).join("")
}

const RELATION_TARGETS: readonly RelationTarget[] = ["artist", "url", "work"]

export function parseRelation(raw: any): Relation | undefined {
    const type = asString(raw?.type)
    if (type === undefined) {
        return undefined
    }
    const rawTarget = asString(raw?.["target-type"])
    const targetType = RELATION_TARGETS.find((target) => target === rawTarget) ?? "other"
    const attributeCredits: Record<string, string> = {}
    for (const [name, credit] of Object.entries(raw?.["attribute-credits"] ?? {})) {
        if (typeof credit === "string" && credit.length > 0) {
            attributeCredits[name] = credit
        }
    }
    return {
        type,
        direction: raw?.direction === "forward" ? "forward" : "backward",
        targetType,
        attributes: asArray(raw?.attributes).filter((a): a is string => typeof a === "string"),
        attributeCredits,
        targetCredit: asString(raw?.["target-credit"]),
        artist: targetType === "artist" ? parseEntityRef(raw?.artist) : undefined,
        url: targetType === "url" ? asString(raw?.url?.resource) : undefined,
        work: targetType === "work" ? parseWork(raw?.work) : undefined,
        begin: asString(raw?.begin),
        end: asString(raw?.end),
        ended: raw?.ended === true,
    }
}

export function parseRelations(raw: unknown): readonly Relation[] {
    return asArray(raw).flatMap((relation) => parseRelation(relation) ?? [])
}

function parseWork(raw: any): Work | undefined {
    const id = asString(raw?.id)
    if (id === undefined) {
        return undefined
    }
    return { id, title: asString(raw?.title) ?? "", relations: parseRelations(raw?.relations) }
}

/**
 * Genres are curated tags, so they shadow the same names among tags. Both are
 * listed alphabetically by MusicBrainz, and are more useful by weight.
 */
export function parseTags(rawGenres: unknown, rawTags: unknown): readonly Tag[] {
    const tags: Tag[] = []
    const seen = new Set<string>()
    for (const raw of [...asArray(rawGenres), ...asArray(rawTags)]) {
        const name = asString(raw?.name)
        const count = asNumber(raw?.count) ?? 0
        if (name !== undefined && count > 0 && !seen.has(name)) {
            seen.add(name)
            tags.push({ name, count })
        }
    }
    return tags.sort((a, b) => b.count - a.count)
}

function parseMembership(relation: Relation): Membership | undefined {
    if (relation.artist === undefined) {
        return undefined
    }
    return {
        artist: relation.artist,
        roles: relation.attributes.map((attribute) => formatAttribute(relation, attribute)),
        begin: relation.begin,
        end: relation.end,
        ended: relation.ended,
    }
}

export const MUSICBRAINZ_ROOT = "https://musicbrainz.org"

export function parseArtist(raw: any): Artist {
    const id = asString(raw?.id) ?? ""
    const relations = parseRelations(raw?.relations)
    const memberships = relations.filter((relation) => relation.type === "member of band")
    return {
        id,
        name: asString(raw?.name) ?? "",
        sortName: asString(raw?.["sort-name"]) ?? asString(raw?.name) ?? "",
        type: asString(raw?.type),
        disambiguation: asString(raw?.disambiguation),
        country: asString(raw?.country),
        area: asString(raw?.area?.name),
        lifeSpan: {
            begin: asString(raw?.["life-span"]?.begin),
            end: asString(raw?.["life-span"]?.end),
            ended: raw?.["life-span"]?.ended === true,
        },
        tags: parseTags(raw?.genres, raw?.tags),
        // Seen from a group, its members point at it, so the relation runs backward
        members: memberships
            .filter((relation) => relation.direction === "backward")
            .flatMap((relation) => parseMembership(relation) ?? []),
        memberOf: memberships
            .filter((relation) => relation.direction === "forward")
            .flatMap((relation) => parseMembership(relation) ?? []),
        links: extractLinks(relations, `${MUSICBRAINZ_ROOT}/artist/${id}`),
    }
}

export function parseReleaseGroupSummary(raw: any): ReleaseGroupSummary {
    return {
        id: asString(raw?.id) ?? "",
        title: asString(raw?.title) ?? "",
        primaryType: asString(raw?.["primary-type"]),
        secondaryTypes: asArray(raw?.["secondary-types"]).filter(
            (type): type is string => typeof type === "string",
        ),
        firstReleaseDate: asString(raw?.["first-release-date"]),
        artistCredit: parseArtistCredit(raw?.["artist-credit"]),
    }
}

export function parseReleaseSummary(raw: any): ReleaseSummary {
    return {
        id: asString(raw?.id) ?? "",
        title: asString(raw?.title) ?? "",
        status: asString(raw?.status),
        date: asString(raw?.date),
        country: asString(raw?.country),
        disambiguation: asString(raw?.disambiguation),
        trackCount: asNumber(raw?.["track-count"]),
    }
}

export function parseReleaseGroup(raw: any): ReleaseGroup {
    const summary = parseReleaseGroupSummary(raw)
    return {
        ...summary,
        releases: asArray(raw?.releases).map(parseReleaseSummary),
        tags: parseTags(raw?.genres, raw?.tags),
        links: extractLinks(
            parseRelations(raw?.relations),
            `${MUSICBRAINZ_ROOT}/release-group/${summary.id}`,
        ),
    }
}

export function parseRecording(raw: any): Recording {
    return {
        id: asString(raw?.id) ?? "",
        title: asString(raw?.title) ?? "",
        lengthMs: asNumber(raw?.length),
        firstReleaseDate: asString(raw?.["first-release-date"]),
        isrcs: asArray(raw?.isrcs).filter((isrc): isrc is string => typeof isrc === "string"),
        video: raw?.video === true,
        artistCredit: parseArtistCredit(raw?.["artist-credit"]),
        relations: parseRelations(raw?.relations),
    }
}

function parseTrack(raw: any): Track {
    const recording = parseRecording(raw?.recording)
    return {
        id: asString(raw?.id) ?? "",
        number: asString(raw?.number) ?? String(asNumber(raw?.position) ?? ""),
        position: asNumber(raw?.position) ?? 0,
        title: asString(raw?.title) ?? recording.title,
        lengthMs: asNumber(raw?.length) ?? recording.lengthMs,
        recording,
    }
}

function parseMedium(raw: any, index: number): Medium {
    return {
        position: asNumber(raw?.position) ?? index + 1,
        format: asString(raw?.format),
        tracks: asArray(raw?.tracks).map(parseTrack),
    }
}

function parseLabel(raw: any): Label | undefined {
    const name = asString(raw?.label?.name)
    const catalogNumber = asString(raw?.["catalog-number"])
    if (name === undefined && catalogNumber === undefined) {
        return undefined
    }
    return { id: asString(raw?.label?.id), name: name ?? "", catalogNumber }
}

export function parseRelease(raw: any): Release {
    return {
        ...parseReleaseSummary(raw),
        artistCredit: parseArtistCredit(raw?.["artist-credit"]),
        releaseGroup: parseReleaseGroupSummary(raw?.["release-group"]),
        labels: asArray(raw?.["label-info"]).flatMap((info) => parseLabel(info) ?? []),
        media: asArray(raw?.media).map(parseMedium),
        relations: parseRelations(raw?.relations),
        hasCoverArt: raw?.["cover-art-archive"]?.front === true,
    }
}

function parseSearchHitRelease(raw: any): SearchHitRelease {
    return {
        ...parseReleaseSummary(raw),
        releaseGroup: parseReleaseGroupSummary(raw?.["release-group"]),
        media: asArray(raw?.media).map((medium) => ({
            format: asString(medium?.format),
            // A search hit only lists the track the recording appears as
            trackNumber: asString(asArray(medium?.track)[0]?.number),
        })),
    }
}

export function parseRecordingSearch(raw: any): readonly RecordingSearchHit[] {
    return asArray(raw?.recordings).map((hit): RecordingSearchHit => ({
        id: asString(hit?.id) ?? "",
        title: asString(hit?.title) ?? "",
        disambiguation: asString(hit?.disambiguation),
        firstReleaseDate: asString(hit?.["first-release-date"]),
        score: asNumber(hit?.score) ?? 0,
        lengthMs: asNumber(hit?.length),
        video: hit?.video === true,
        artistCredit: parseArtistCredit(hit?.["artist-credit"]),
        releases: asArray(hit?.releases).map(parseSearchHitRelease),
    }))
}

export function parseReleaseGroupBrowse(raw: any): {
    readonly total: number
    readonly releaseGroups: readonly ReleaseGroupSummary[]
} {
    const releaseGroups = asArray(raw?.["release-groups"]).map(parseReleaseGroupSummary)
    return {
        total: asNumber(raw?.["release-group-count"]) ?? releaseGroups.length,
        releaseGroups,
    }
}
