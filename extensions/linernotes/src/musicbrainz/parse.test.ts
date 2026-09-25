import { describe, expect, it } from "vitest"

import artistFixture from "@/musicbrainz/fixtures/artist.json"
import browseFixture from "@/musicbrainz/fixtures/browseReleaseGroups.json"
import personFixture from "@/musicbrainz/fixtures/person.json"
import recordingFixture from "@/musicbrainz/fixtures/recording.json"
import searchFixture from "@/musicbrainz/fixtures/recordingSearch.json"
import releaseFixture from "@/musicbrainz/fixtures/release.json"
import releaseGroupFixture from "@/musicbrainz/fixtures/releaseGroup.json"
import {
    formatArtistCredit,
    parseArtist,
    parseArtistCredit,
    parseRecording,
    parseRecordingSearch,
    parseRelease,
    parseReleaseGroup,
    parseReleaseGroupBrowse,
    parseTags,
} from "@/musicbrainz/parse"

describe("parseArtist", () => {
    it("reads a group with its members and links", () => {
        const artist = parseArtist(artistFixture)
        expect(artist.name).toBe("Nirvana")
        expect(artist.type).toBe("Group")
        expect(artist.area).toBe("United States")
        expect(artist.lifeSpan).toEqual({ begin: "1988-01", end: "1994-04-05", ended: true })
        expect(artist.members.map((member) => member.artist.name)).toEqual([
            "Kurt Cobain",
            "Dave Grohl",
        ])
        expect(artist.members[0].roles).toEqual(["lead vocals", "guitar"])
        expect(artist.members[1].roles).toEqual(["drums"])
        expect(artist.memberOf).toEqual([])
        expect(artist.links).toEqual({
            musicbrainz: "https://musicbrainz.org/artist/artist-nirvana",
            wikidataId: "Q11649",
            lastfm: "https://www.last.fm/music/Nirvana",
            homepage: "https://www.nirvana.com/",
        })
    })

    it("reads a person with the groups they belong to", () => {
        const artist = parseArtist(personFixture)
        expect(artist.members).toEqual([])
        expect(artist.memberOf[0].artist.name).toBe("Nirvana")
        expect(artist.lifeSpan.ended).toBe(false)
        expect(artist.links.wikipediaTitle).toBe("Dave_Grohl")
    })

    it("copes with an empty payload", () => {
        const artist = parseArtist({})
        expect(artist.id).toBe("")
        expect(artist.tags).toEqual([])
    })
})

describe("parseTags", () => {
    it("puts genres first and drops duplicates and empty counts", () => {
        expect(parseTags(artistFixture.genres, artistFixture.tags)).toEqual([
            { name: "grunge", count: 21 },
            { name: "alternative rock", count: 14 },
            { name: "seattle", count: 3 },
        ])
    })
})

describe("parseArtistCredit", () => {
    it("keeps join phrases so the credit can be printed", () => {
        const credit = parseArtistCredit([
            { name: "Simon", joinphrase: " & ", artist: { id: "a", name: "Paul Simon" } },
            { name: "Garfunkel", artist: { id: "b", name: "Art Garfunkel" } },
        ])
        expect(formatArtistCredit(credit)).toBe("Simon & Garfunkel")
        expect(credit[0].artist.name).toBe("Paul Simon")
    })
})

describe("parseRelease", () => {
    it("reads labels, media, tracks and relationships", () => {
        const release = parseRelease(releaseFixture)
        expect(release.title).toBe("Nevermind")
        expect(release.labels).toEqual([
            { id: "label-dgc", name: "DGC", catalogNumber: "DGCD-24425" },
        ])
        expect(release.releaseGroup.firstReleaseDate).toBe("1991-09-24")
        expect(release.hasCoverArt).toBe(true)
        expect(release.media[0].format).toBe("CD")
        expect(release.media[0].tracks.map((track) => track.title)).toEqual([
            "Smells Like Teen Spirit",
            "In Bloom",
        ])
        expect(release.media[0].tracks[0].recording.relations).toHaveLength(4)
        expect(
            release.relations.filter((relation) => relation.targetType === "artist"),
        ).toHaveLength(5)
    })

    it("attaches works to their performance relationships", () => {
        const release = parseRelease(releaseFixture)
        const performance = release.media[0].tracks[0].recording.relations.find(
            (relation) => relation.type === "performance",
        )
        expect(performance?.work?.title).toBe("Smells Like Teen Spirit")
        expect(performance?.work?.relations.map((relation) => relation.artist?.name)).toEqual([
            "Kurt Cobain",
            "Dave Grohl",
        ])
    })

    it("keeps attribute credits", () => {
        const release = parseRelease(releaseFixture)
        const drums = release.media[0].tracks[0].recording.relations[2]
        expect(drums.attributes).toEqual(["drums (drum set)"])
        expect(drums.attributeCredits).toEqual({ "drums (drum set)": "drums" })
    })
})

describe("parseReleaseGroup", () => {
    it("reads releases and links", () => {
        const releaseGroup = parseReleaseGroup(releaseGroupFixture)
        expect(releaseGroup.primaryType).toBe("Album")
        expect(releaseGroup.releases).toHaveLength(3)
        expect(releaseGroup.releases[2].disambiguation).toBe("remastered")
        expect(releaseGroup.links.wikidataId).toBe("Q201706")
        expect(releaseGroup.links.lastfm).toBe("https://www.last.fm/music/Nirvana/Nevermind")
        expect(releaseGroup.tags).toEqual([{ name: "grunge", count: 10 }])
    })
})

describe("parseRecording", () => {
    it("reads identifiers and relationships", () => {
        const recording = parseRecording(recordingFixture)
        expect(recording.isrcs).toEqual(["USGF19142501"])
        expect(recording.firstReleaseDate).toBe("1991-09-10")
        expect(recording.lengthMs).toBe(301920)
        expect(recording.video).toBe(false)
        expect(recording.relations[1].work?.relations[0].artist?.name).toBe("Kurt Cobain")
    })
})

describe("parseRecordingSearch", () => {
    it("reads hits with their releases", () => {
        const hits = parseRecordingSearch(searchFixture)
        expect(hits.map((hit) => hit.id)).toEqual([
            "rec-video",
            "rec-album",
            "rec-anniversary-live",
            "rec-live",
        ])
        expect(hits[0].disambiguation).toBe("official music video")
        expect(hits[1].firstReleaseDate).toBe("1991-09-10")
        expect(hits[0].video).toBe(true)
        // `null` is how MusicBrainz says "not a video"
        expect(hits[1].video).toBe(false)
        expect(hits[1].releases[0].releaseGroup.id).toBe("rg-nevermind")
        expect(hits[1].releases[0].media[0].trackNumber).toBe("1")
        expect(hits[3].releases[0].releaseGroup.secondaryTypes).toEqual(["Live"])
    })
})

describe("parseReleaseGroupBrowse", () => {
    it("reads the page and the total", () => {
        const page = parseReleaseGroupBrowse(browseFixture)
        expect(page.total).toBe(3)
        expect(page.releaseGroups.map((releaseGroup) => releaseGroup.title)).toEqual([
            "Bleach",
            "Nevermind",
            "MTV Unplugged in New York",
        ])
    })
})
