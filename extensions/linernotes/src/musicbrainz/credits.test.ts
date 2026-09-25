import { describe, expect, it } from "vitest"

import type { Relation } from "@/model/types"
import {
    aggregateCredits,
    collectRecordingCredits,
    collectReleaseCredits,
    formatRole,
    groupCredits,
} from "@/musicbrainz/credits"
import recordingFixture from "@/musicbrainz/fixtures/recording.json"
import releaseFixture from "@/musicbrainz/fixtures/release.json"
import { parseRecording, parseRelease } from "@/musicbrainz/parse"

function relation(overrides: Partial<Relation>): Relation {
    return {
        type: "producer",
        direction: "backward",
        targetType: "artist",
        attributes: [],
        attributeCredits: {},
        ended: false,
        artist: { id: "a", name: "Someone" },
        ...overrides,
    }
}

describe("formatRole", () => {
    it("names instruments and vocals after what was played", () => {
        expect(
            formatRole(relation({ type: "instrument", attributes: ["guitar", "theremin"] })),
        ).toBe("guitar, theremin")
        expect(formatRole(relation({ type: "instrument" }))).toBe("instrument")
        expect(formatRole(relation({ type: "instrument", attributes: ["drums (drum set)"] }))).toBe(
            "drums",
        )
        expect(formatRole(relation({ type: "vocal", attributes: ["lead vocals"] }))).toBe(
            "lead vocals",
        )
        expect(formatRole(relation({ type: "vocal" }))).toBe("vocals")
    })

    it("uses the credited name of an attribute", () => {
        expect(
            formatRole(
                relation({
                    type: "instrument",
                    attributes: ["drums (drum set)"],
                    attributeCredits: { "drums (drum set)": "drums" },
                }),
            ),
        ).toBe("drums")
    })

    it("qualifies other roles with their attributes", () => {
        expect(formatRole(relation({ type: "producer", attributes: ["co"] }))).toBe("producer (co)")
        expect(formatRole(relation({ type: "engineer", attributes: ["assistant"] }))).toBe(
            "engineer (assistant)",
        )
        expect(formatRole(relation({ type: "mix" }))).toBe("mix")
    })
})

describe("aggregateCredits", () => {
    it("merges roles per artist in order of first appearance", () => {
        const credits = aggregateCredits([
            relation({ type: "producer", artist: { id: "b", name: "Butch" } }),
            relation({
                type: "instrument",
                attributes: ["guitar"],
                artist: { id: "k", name: "Kurt" },
            }),
            relation({ type: "mix", artist: { id: "b", name: "Butch" } }),
            relation({ type: "mix", artist: { id: "b", name: "Butch" } }),
        ])
        expect(credits).toEqual([
            { artist: { id: "b", name: "Butch" }, roles: ["producer", "mix"] },
            { artist: { id: "k", name: "Kurt" }, roles: ["guitar"] },
        ])
    })

    it("ignores relationships that do not point at an artist", () => {
        expect(
            aggregateCredits([
                relation({
                    type: "wikidata",
                    targetType: "url",
                    artist: undefined,
                    url: "https://x",
                }),
            ]),
        ).toEqual([])
    })
})

describe("collectReleaseCredits", () => {
    it("combines release, recording and work credits", () => {
        const credits = collectReleaseCredits(parseRelease(releaseFixture))
        const byName = Object.fromEntries(
            credits.map((credit) => [credit.artist.name, credit.roles]),
        )
        expect(byName["Butch Vig"]).toEqual(["producer"])
        expect(byName["Nirvana"]).toEqual(["producer"])
        expect(byName["Andy Wallace"]).toEqual(["mix"])
        expect(byName["Jeff Sheehan"]).toEqual(["engineer (assistant)"])
        // Roles repeated across tracks collapse, and work writers are included
        expect(byName["Kurt Cobain"]).toEqual(["guitar", "lead vocals", "writer"])
        expect(byName["Dave Grohl"]).toEqual(["drums", "writer"])
        expect(byName["Krist Novoselic"]).toEqual(["bass guitar"])
        expect(credits.map((credit) => credit.artist.name)[0]).toBe("Butch Vig")
    })
})

describe("collectRecordingCredits", () => {
    it("includes the writers of the work performed", () => {
        const credits = collectRecordingCredits(parseRecording(recordingFixture))
        expect(credits).toEqual([
            { artist: { id: "artist-vig", name: "Butch Vig" }, roles: ["producer"] },
            { artist: { id: "artist-cobain", name: "Kurt Cobain" }, roles: ["writer"] },
        ])
    })
})

describe("groupCredits", () => {
    it("buckets roles and lists an artist in every group they belong to", () => {
        const groups = groupCredits(collectReleaseCredits(parseRelease(releaseFixture)))
        expect(groups.map((group) => group.title)).toEqual([
            "Performers",
            "Writers",
            "Production",
            "Engineering",
            "Art & Design",
        ])
        const performers = groups[0].credits
        expect(performers.map((credit) => credit.artist.name)).toEqual([
            "Kurt Cobain",
            "Dave Grohl",
            "Krist Novoselic",
        ])
        expect(performers[0].roles).toEqual(["guitar", "lead vocals"])
        expect(groups[1].credits.map((credit) => credit.artist.name)).toEqual([
            "Kurt Cobain",
            "Dave Grohl",
        ])
        expect(groups[1].credits[0].roles).toEqual(["writer"])
        expect(groups[3].credits.map((credit) => credit.roles)).toEqual([
            ["mix"],
            ["engineer (assistant)"],
        ])
        expect(groups[4].credits[0].artist.name).toBe("Kirk Weddle")
    })

    it("leaves out empty groups", () => {
        expect(groupCredits([{ artist: { id: "a", name: "A" }, roles: ["producer"] }])).toEqual([
            {
                title: "Production",
                credits: [{ artist: { id: "a", name: "A" }, roles: ["producer"] }],
            },
        ])
    })
})
