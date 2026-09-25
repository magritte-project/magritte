import { describe, expect, it } from "vitest"

import { extractReadMoreUrl, htmlToText, stripReadMoreTail } from "@/utilities/html"

const BIO =
    'Nirvana was an American rock band. <a href="https://www.last.fm/music/Nirvana">Read more on Last.fm</a>.'

describe("stripReadMoreTail", () => {
    it("drops the link and the full stop after it", () => {
        expect(stripReadMoreTail(BIO)).toBe("Nirvana was an American rock band.")
    })

    it("leaves text without the link alone", () => {
        expect(stripReadMoreTail("Just a bio.")).toBe("Just a bio.")
    })
})

describe("extractReadMoreUrl", () => {
    it("returns the link target", () => {
        expect(extractReadMoreUrl(BIO)).toBe("https://www.last.fm/music/Nirvana")
    })

    it("decodes entities in the target", () => {
        expect(
            extractReadMoreUrl(
                '<a href="https://www.last.fm/music/Simon+%26+Garfunkel">Read more on Last.fm</a>',
            ),
        ).toBe("https://www.last.fm/music/Simon+%26+Garfunkel")
    })

    it("is undefined without the link", () => {
        expect(extractReadMoreUrl("Just a bio.")).toBeUndefined()
    })
})

describe("htmlToText", () => {
    it("keeps paragraphs apart and collapses whitespace", () => {
        expect(htmlToText("<p>One   two</p><p>Three</p>")).toBe("One two\n\nThree")
    })

    it("turns line breaks into lines and strips tags", () => {
        expect(htmlToText("First<br />Second <b>bold</b>")).toBe("First\nSecond bold")
    })

    it("decodes entities", () => {
        expect(htmlToText("Simon &amp; Garfunkel &quot;live&quot;")).toBe(
            'Simon & Garfunkel "live"',
        )
    })

    it("never keeps markup", () => {
        expect(htmlToText('<script>alert("x")</script>Hi<img src=x onerror="alert(1)">')).toBe("Hi")
    })
})
