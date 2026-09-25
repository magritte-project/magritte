import type { PlayableItem } from "@magritte/sdk"
import { describe, expect, it } from "vitest"

import searchFixture from "@/musicbrainz/fixtures/recordingSearch.json"
import {
    buildRecordingQuery,
    chooseRecordingMatch,
    formatLuceneQuery,
    quoteLucene,
} from "@/musicbrainz/match"
import { parseRecordingSearch } from "@/musicbrainz/parse"

function item(overrides: Partial<PlayableItem> = {}): PlayableItem {
    return {
        id: 1,
        title: "Smells Like Teen Spirit",
        artist_name: "Nirvana",
        album_title: "Nevermind",
        end_time: 301.9,
        ...overrides,
    }
}

const hits = parseRecordingSearch(searchFixture)

describe("buildRecordingQuery", () => {
    it("needs a title and an artist", () => {
        expect(buildRecordingQuery(item({ title: " " }))).toBeNull()
        expect(buildRecordingQuery(item({ artist_name: null }))).toBeNull()
        expect(buildRecordingQuery(null)).toBeNull()
    })

    it("includes the album when there is one", () => {
        expect(buildRecordingQuery(item())).toEqual({
            title: "Smells Like Teen Spirit",
            artist: "Nirvana",
            album: "Nevermind",
        })
        expect(buildRecordingQuery(item({ album_title: "" }))?.album).toBeUndefined()
    })

    it("searches without edition and featuring suffixes", () => {
        expect(
            buildRecordingQuery(
                item({
                    title: "Come Together - Remastered 2009",
                    album_title: "Abbey Road (Remastered)",
                }),
            ),
        ).toEqual({ title: "Come Together", artist: "Nirvana", album: "Abbey Road" })
    })
})

describe("formatLuceneQuery", () => {
    it("quotes and escapes terms", () => {
        expect(quoteLucene('Say "Hi" \\ Bye')).toBe('"Say \\"Hi\\" \\\\ Bye"')
        expect(formatLuceneQuery({ title: "A", artist: "B", album: "C" })).toBe(
            'recording:"A" AND artist:"B" AND release:"C"',
        )
        expect(
            formatLuceneQuery({ title: "A", artist: "B", album: "C" }, { includeAlbum: false }),
        ).toBe('recording:"A" AND artist:"B"')
    })
})

describe("chooseRecordingMatch", () => {
    it("prefers the album recording over a music video with the same score", () => {
        const match = chooseRecordingMatch(hits, item())
        expect(match?.recording.id).toBe("rec-album")
        expect(match?.artist.id).toBe("artist-nirvana")
        expect(match?.release?.id).toBe("rel-nevermind-us")
        expect(match?.releaseGroup?.id).toBe("rg-nevermind")
        expect(match?.albumMatched).toBe(true)
    })

    it("follows the album title to a live recording", () => {
        const match = chooseRecordingMatch(
            hits,
            item({
                title: "Smells Like Teen Spirit",
                album_title: "From the Muddy Banks of the Wishkah",
            }),
        )
        expect(match?.recording.id).toBe("rec-live")
        expect(match?.releaseGroup?.id).toBe("rg-live")
    })

    it("still picks the best release when the album is unknown", () => {
        const match = chooseRecordingMatch(hits, item({ album_title: null }))
        expect(match?.recording.id).toBe("rec-album")
        // The official studio album beats the compilation
        expect(match?.release?.id).toBe("rel-nevermind-us")
        expect(match?.albumMatched).toBe(false)
    })

    it("prefers the studio recording over a live take from a reissue of the same album", () => {
        const anniversary = hits.find((hit) => hit.id === "rec-anniversary-live")!
        const studio = hits.find((hit) => hit.id === "rec-album")!
        expect(chooseRecordingMatch([anniversary, studio], item())?.recording.id).toBe("rec-album")
        // A live recording is what is playing, so the live take is the one that fits
        expect(
            chooseRecordingMatch(
                [anniversary, studio],
                item({ title: "Smells Like Teen Spirit (live)" }),
            )?.recording.id,
        ).toBe("rec-anniversary-live")
    })

    it("treats a variant named in the title like one named in the disambiguation", () => {
        const remix = {
            ...hits[1],
            id: "rec-remix",
            title: "Smells Like Teen Spirit (Devonshire mix)",
        }
        expect(chooseRecordingMatch([remix, hits[1]], item())?.recording.id).toBe("rec-album")
        expect(
            chooseRecordingMatch(
                [remix, hits[1]],
                item({ title: "Smells Like Teen Spirit (Devonshire Mix)" }),
            )?.recording.id,
        ).toBe("rec-remix")
    })

    it("prefers the recording which came out the year the item says", () => {
        const later = { ...hits[1], id: "rec-later", firstReleaseDate: "2021-11-11" }
        expect(
            chooseRecordingMatch([later, hits[1]], item({ release_date: "1991-09-24" }))?.recording
                .id,
        ).toBe("rec-album")
        expect(
            chooseRecordingMatch([hits[1], later], item({ release_date: "2021-11-12" }))?.recording
                .id,
        ).toBe("rec-later")
    })

    it("rules out recordings which first appeared after the item came out", () => {
        const reissue = {
            ...hits[1],
            id: "rec-reissue",
            score: 100,
            firstReleaseDate: "2021-11-11",
            releases: [
                {
                    ...hits[1].releases[0],
                    id: "rel-30",
                    title: "Nevermind (30th Anniversary Super Deluxe)",
                    date: "2021-11-12",
                },
            ],
        }
        const original = { ...hits[1], score: 80 }
        expect(
            chooseRecordingMatch([reissue, original], item({ release_date: "1991-09-24" }))
                ?.recording.id,
        ).toBe("rec-album")
    })

    it("does not let a live album with a longer title vouch for a live take", () => {
        const live = hits.find((hit) => hit.id === "rec-live")!
        expect(
            chooseRecordingMatch([live], item({ album_title: "From the Muddy Banks" })),
        ).toBeNull()
    })

    it("never matches a music video or an unwanted variant", () => {
        expect(chooseRecordingMatch([hits[0]], item())).toBeNull()
        const anniversary = hits.find((hit) => hit.id === "rec-anniversary-live")!
        expect(chooseRecordingMatch([anniversary], item())).toBeNull()
    })

    it("rejects implausible hits", () => {
        const weak = hits.map((hit) => ({ ...hit, score: 20 }))
        expect(chooseRecordingMatch(weak, item())).toBeNull()
        expect(chooseRecordingMatch([], item())).toBeNull()
    })

    it("uses the length to separate otherwise equal recordings", () => {
        const shorter = { ...hits[1], id: "rec-short", lengthMs: 200_000 }
        const match = chooseRecordingMatch(
            [shorter, hits[1]],
            item({ start_time: 0, end_time: 302 }),
        )
        expect(match?.recording.id).toBe("rec-album")
    })
})
