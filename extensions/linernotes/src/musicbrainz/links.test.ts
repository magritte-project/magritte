import { describe, expect, it } from "vitest"

import type { Relation } from "@/model/types"
import { extractLinks } from "@/musicbrainz/links"

function urlRelation(type: string, url: string): Relation {
    return {
        type,
        direction: "forward",
        targetType: "url",
        attributes: [],
        attributeCredits: {},
        url,
        ended: false,
    }
}

describe("extractLinks", () => {
    it("always includes the MusicBrainz page", () => {
        expect(extractLinks([], "https://musicbrainz.org/artist/x")).toEqual({
            musicbrainz: "https://musicbrainz.org/artist/x",
        })
    })

    it("reads the Wikidata id from the url", () => {
        expect(
            extractLinks([urlRelation("wikidata", "https://www.wikidata.org/wiki/Q11649")], "mb")
                .wikidataId,
        ).toBe("Q11649")
    })

    it("only keeps English Wikipedia articles", () => {
        expect(
            extractLinks(
                [urlRelation("wikipedia", "https://de.wikipedia.org/wiki/Nirvana_(Band)")],
                "mb",
            ).wikipediaTitle,
        ).toBeUndefined()
        expect(
            extractLinks(
                [urlRelation("wikipedia", "https://en.wikipedia.org/wiki/Nirvana_%28band%29")],
                "mb",
            ).wikipediaTitle,
        ).toBe("Nirvana_(band)")
    })

    it("takes last.fm from discography entries too", () => {
        const links = extractLinks(
            [
                urlRelation("discography entry", "https://www.allmusic.com/album/x"),
                urlRelation("discography entry", "https://www.last.fm/music/Nirvana/Nevermind"),
            ],
            "mb",
        )
        expect(links.lastfm).toBe("https://www.last.fm/music/Nirvana/Nevermind")
        expect(links.allmusic).toBeUndefined()
    })

    it("keeps the first of each kind", () => {
        const links = extractLinks(
            [
                urlRelation("official homepage", "https://one.example"),
                urlRelation("official homepage", "https://two.example"),
            ],
            "mb",
        )
        expect(links.homepage).toBe("https://one.example")
    })
})
