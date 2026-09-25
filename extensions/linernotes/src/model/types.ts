/** A reference to a MusicBrainz entity, enough to link to it or look it up */
export interface EntityRef {
    readonly id: string
    readonly name: string
}

/** One part of an artist credit, e.g. `Simon` in `Simon & Garfunkel` */
export interface ArtistCreditPart {
    /** The name as credited, which can differ from the artist's name */
    readonly name: string
    /** The text between this part and the next, empty for the last part */
    readonly joinPhrase: string
    readonly artist: EntityRef
}

export type RelationTarget = "artist" | "url" | "work" | "other"

/** A MusicBrainz relationship, as attached to an artist, release, recording or work */
export interface Relation {
    /** The relationship type, e.g. `producer`, `instrument`, `vocal`, `wikidata` */
    readonly type: string
    readonly direction: "forward" | "backward"
    readonly targetType: RelationTarget
    /** Qualifiers such as `["guitar", "theremin"]`, `["lead vocals"]` or `["co"]` */
    readonly attributes: readonly string[]
    /** How an attribute was credited, keyed by attribute, e.g. `{ "drums (drum set)": "drums" }` */
    readonly attributeCredits: Readonly<Record<string, string>>
    /** The artist's name as credited on this relationship, when it differs */
    readonly targetCredit?: string
    readonly artist?: EntityRef
    readonly url?: string
    readonly work?: Work
    readonly begin?: string
    readonly end?: string
    readonly ended: boolean
}

export interface Work {
    readonly id: string
    readonly title: string
    /** Typically writer, composer and lyricist relationships */
    readonly relations: readonly Relation[]
}

export interface Tag {
    readonly name: string
    readonly count: number
}

/** Where else an entity can be read about */
export interface ExternalLinks {
    readonly musicbrainz: string
    /** A Wikidata item id such as `Q11649`, resolved to a Wikipedia article on demand */
    readonly wikidataId?: string
    /** Only present when MusicBrainz still holds a direct Wikipedia link */
    readonly wikipediaTitle?: string
    readonly lastfm?: string
    readonly discogs?: string
    readonly homepage?: string
    readonly allmusic?: string
}

export interface Membership {
    /** The member when listed on a group, or the group when listed on a person */
    readonly artist: EntityRef
    /** What they did in the group, e.g. `["lead vocals", "original"]` */
    readonly roles: readonly string[]
    readonly begin?: string
    readonly end?: string
    readonly ended: boolean
}

export interface LifeSpan {
    readonly begin?: string
    readonly end?: string
    readonly ended: boolean
}

export interface Artist {
    readonly id: string
    readonly name: string
    readonly sortName: string
    /** `Person`, `Group`, `Orchestra`, ... */
    readonly type?: string
    readonly disambiguation?: string
    readonly country?: string
    readonly area?: string
    readonly lifeSpan: LifeSpan
    /** Genres first, then folksonomy tags, without duplicates */
    readonly tags: readonly Tag[]
    /** The members of this group */
    readonly members: readonly Membership[]
    /** The groups this person is or was in */
    readonly memberOf: readonly Membership[]
    readonly links: ExternalLinks
}

export interface ReleaseGroupSummary {
    readonly id: string
    readonly title: string
    /** `Album`, `EP`, `Single`, ... */
    readonly primaryType?: string
    /** `Compilation`, `Live`, `Soundtrack`, ... */
    readonly secondaryTypes: readonly string[]
    readonly firstReleaseDate?: string
    readonly artistCredit: readonly ArtistCreditPart[]
}

export interface ReleaseSummary {
    readonly id: string
    readonly title: string
    /** `Official`, `Bootleg`, `Promotion`, ... */
    readonly status?: string
    readonly date?: string
    readonly country?: string
    readonly disambiguation?: string
    readonly trackCount?: number
}

export interface ReleaseGroup extends ReleaseGroupSummary {
    readonly releases: readonly ReleaseSummary[]
    readonly tags: readonly Tag[]
    readonly links: ExternalLinks
}

export interface Label {
    readonly id?: string
    readonly name: string
    readonly catalogNumber?: string
}

export interface Track {
    readonly id: string
    /** The number as printed, e.g. `A1` on vinyl */
    readonly number: string
    readonly position: number
    readonly title: string
    readonly lengthMs?: number
    readonly recording: Recording
}

export interface Medium {
    readonly position: number
    readonly format?: string
    readonly tracks: readonly Track[]
}

export interface Release extends ReleaseSummary {
    readonly artistCredit: readonly ArtistCreditPart[]
    readonly releaseGroup: ReleaseGroupSummary
    readonly labels: readonly Label[]
    readonly media: readonly Medium[]
    /** Release-level relationships, e.g. producer, engineer, design */
    readonly relations: readonly Relation[]
    readonly hasCoverArt: boolean
}

export interface Recording {
    readonly id: string
    readonly title: string
    readonly lengthMs?: number
    readonly firstReleaseDate?: string
    readonly isrcs: readonly string[]
    readonly video: boolean
    readonly artistCredit: readonly ArtistCreditPart[]
    /** Artist, url and work relationships; works carry their own writer relationships */
    readonly relations: readonly Relation[]
}

/** One credited person and everything they did */
export interface Credit {
    readonly artist: EntityRef
    readonly roles: readonly string[]
}

export interface CreditGroup {
    readonly title: string
    readonly credits: readonly Credit[]
}

export interface SearchHitRelease extends ReleaseSummary {
    readonly releaseGroup: ReleaseGroupSummary
    readonly media: readonly {
        readonly format?: string
        /** The number of the track this recording appears as */
        readonly trackNumber?: string
    }[]
}

export interface RecordingSearchHit {
    readonly id: string
    readonly title: string
    /** How MusicBrainz tells recordings of the same song apart, e.g. `live, 1992-02-01: The Palace` */
    readonly disambiguation?: string
    readonly firstReleaseDate?: string
    /** MusicBrainz's relevance, 0 to 100 */
    readonly score: number
    readonly lengthMs?: number
    readonly video: boolean
    readonly artistCredit: readonly ArtistCreditPart[]
    readonly releases: readonly SearchHitRelease[]
}

/** The MusicBrainz entities the playing item was matched to */
export interface TrackMatch {
    readonly recording: EntityRef
    readonly artist: EntityRef
    readonly release?: EntityRef
    readonly releaseGroup?: EntityRef
    /** Whether the release was chosen because its title matched the playing album */
    readonly albumMatched: boolean
}

export type ProseSource = "wikipedia" | "lastfm"

/** Something to read, with where it came from */
export interface Prose {
    readonly source: ProseSource
    /** Plain text, paragraphs separated by blank lines */
    readonly text: string
    readonly title?: string
    /** Wikipedia's one-line description, e.g. `American rock band` */
    readonly description?: string
    readonly thumbnailUrl?: string
    /** Where to read the rest */
    readonly sourceUrl: string
}

export interface LastfmStats {
    readonly listeners: number
    readonly playCount: number
}

export interface LastfmArtistInfo {
    readonly name: string
    readonly url: string
    readonly stats: LastfmStats
    readonly tags: readonly string[]
    readonly similar: readonly { readonly name: string; readonly url: string }[]
    readonly bio: Prose | null
}

export interface LastfmAlbumInfo {
    readonly name: string
    readonly artist: string
    readonly url: string
    readonly stats: LastfmStats
    readonly tags: readonly string[]
    readonly tracks: readonly {
        readonly rank: number
        readonly name: string
        readonly durationSec?: number
    }[]
    readonly wiki: Prose | null
    readonly imageUrl?: string
}

export interface LastfmTrackInfo {
    readonly name: string
    readonly artist: string
    readonly url: string
    readonly durationMs?: number
    readonly stats: LastfmStats
    readonly tags: readonly string[]
    readonly wiki: Prose | null
}
