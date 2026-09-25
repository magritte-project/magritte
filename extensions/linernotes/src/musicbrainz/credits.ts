import type { Credit, CreditGroup, EntityRef, Recording, Relation, Release } from "@/model/types"

/** A relation which credits a person or group for something */
function isArtistCredit(relation: Relation): relation is Relation & { artist: EntityRef } {
    return relation.targetType === "artist" && relation.artist !== undefined
}

/**
 * What an attribute should be called: the credited form when there is one,
 * otherwise the name without the qualifier MusicBrainz adds to tell instruments
 * apart, e.g. `drums (drum set)` is shown as `drums`.
 */
export function formatAttribute(relation: Relation, attribute: string): string {
    return relation.attributeCredits[attribute] ?? attribute.replace(/\s*\([^)]*\)$/, "")
}

/** Attributes which describe the kind of involvement rather than what was played */
function qualifiers(relation: Relation): string {
    return relation.attributes.length > 0 ? ` (${relation.attributes.join(", ")})` : ""
}

/**
 * Describe what a relationship credits someone for, e.g. `guitar`,
 * `lead vocals`, `producer (co)` or `engineer (assistant)`.
 */
export function formatRole(relation: Relation): string {
    switch (relation.type) {
        case "instrument": {
            const instruments = relation.attributes.map((attribute) =>
                formatAttribute(relation, attribute),
            )
            return instruments.length > 0 ? instruments.join(", ") : "instrument"
        }
        case "vocal": {
            const parts = relation.attributes.map((attribute) =>
                formatAttribute(relation, attribute),
            )
            return parts.length > 0 ? parts.join(", ") : "vocals"
        }
        case "performer": {
            return relation.attributes.length > 0 ? relation.attributes.join(", ") : "performer"
        }
        default:
            return `${relation.type}${qualifiers(relation)}`
    }
}

/**
 * Fold relationships into one entry per artist, keeping the order in which
 * people first appear so that the main contributors tend to come first.
 */
export function aggregateCredits(relations: readonly Relation[]): readonly Credit[] {
    const credits = new Map<string, { artist: EntityRef; roles: string[] }>()
    const add = (relation: Relation) => {
        if (!isArtistCredit(relation)) {
            return
        }
        const role = formatRole(relation)
        const existing = credits.get(relation.artist.id)
        if (existing === undefined) {
            credits.set(relation.artist.id, { artist: relation.artist, roles: [role] })
        } else if (!existing.roles.includes(role)) {
            existing.roles.push(role)
        }
    }
    for (const relation of relations) {
        add(relation)
        // Writers are credited on the work a recording performs, not the recording
        if (relation.work !== undefined) {
            for (const workRelation of relation.work.relations) {
                add(workRelation)
            }
        }
    }
    return [...credits.values()].map(({ artist, roles }) => ({ artist, roles }))
}

/** Everyone credited on a release, across the release itself and all of its recordings */
export function collectReleaseCredits(release: Release): readonly Credit[] {
    const relations: Relation[] = [...release.relations]
    for (const medium of release.media) {
        for (const track of medium.tracks) {
            relations.push(...track.recording.relations)
        }
    }
    return aggregateCredits(relations)
}

export function collectRecordingCredits(recording: Recording): readonly Credit[] {
    return aggregateCredits(recording.relations)
}

interface GroupDefinition {
    readonly title: string
    readonly matches: (role: string) => boolean
}

const startsWithAny = (prefixes: readonly string[]) => (role: string) =>
    prefixes.some(
        (prefix) =>
            role === prefix || role.startsWith(`${prefix} `) || role.startsWith(`${prefix} (`),
    )

/**
 * The buckets credits are shown in. A relationship type is checked against
 * these in order, and anything unrecognised is a performer since instrument
 * and vocal roles are named after what was played rather than a type.
 */
const GROUPS: readonly GroupDefinition[] = [
    {
        title: "Writers",
        matches: startsWithAny([
            "writer",
            "composer",
            "lyricist",
            "librettist",
            "translator",
            "arranger",
            "orchestrator",
        ]),
    },
    {
        title: "Production",
        matches: startsWithAny([
            "producer",
            "executive producer",
            "remixer",
            "creative direction",
            "misc",
        ]),
    },
    {
        title: "Engineering",
        matches: startsWithAny([
            "engineer",
            "mix",
            "mastering",
            "recording",
            "sound",
            "editor",
            "programming",
            "balance",
            "audio",
        ]),
    },
    {
        title: "Art & Design",
        matches: startsWithAny([
            "design",
            "illustration",
            "photography",
            "art direction",
            "graphic design",
            "artwork",
            "booklet",
        ]),
    },
]

const PERFORMERS: GroupDefinition = { title: "Performers", matches: () => true }

function groupFor(role: string): GroupDefinition {
    return GROUPS.find((group) => group.matches(role)) ?? PERFORMERS
}

/**
 * Split credits into groups, showing performers first. An artist appears in
 * every group they have a role in, but only with the roles that belong there.
 */
export function groupCredits(credits: readonly Credit[]): readonly CreditGroup[] {
    const groups = new Map<string, Credit[]>()
    for (const credit of credits) {
        const byGroup = new Map<string, string[]>()
        for (const role of credit.roles) {
            const { title } = groupFor(role)
            const roles = byGroup.get(title) ?? []
            roles.push(role)
            byGroup.set(title, roles)
        }
        for (const [title, roles] of byGroup) {
            const members = groups.get(title) ?? []
            members.push({ artist: credit.artist, roles })
            groups.set(title, members)
        }
    }
    const order = [PERFORMERS, ...GROUPS].map((group) => group.title)
    return order.flatMap((title) => {
        const members = groups.get(title)
        return members !== undefined ? [{ title, credits: members }] : []
    })
}
