import { describe, expect, it, vi } from "vitest"

import { WikipediaClient, WikipediaNetworkError, encodeTitle } from "@/wikipedia/client"

type FetchMock = ReturnType<typeof respondWith>

function respondWith(payload: unknown, { status = 200 } = {}) {
    return vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify(payload), { status }),
    )
}

function makeClient(fetch: FetchMock) {
    return new WikipediaClient({ fetch: fetch as typeof globalThis.fetch })
}

function requestUrl(fetch: FetchMock): URL {
    return new URL(String(fetch.mock.calls[0][0]))
}

describe("encodeTitle", () => {
    it("uses underscores for spaces and encodes the rest", () => {
        expect(encodeTitle("Nirvana (band)")).toBe("Nirvana_(band)")
        expect(encodeTitle("Björk")).toBe("Bj%C3%B6rk")
        expect(encodeTitle("AC/DC")).toBe("AC%2FDC")
    })
})

describe("WikipediaClient", () => {
    it("resolves a Wikidata item to an English title", async () => {
        const fetch = respondWith({
            entities: {
                Q11649: { sitelinks: { enwiki: { site: "enwiki", title: "Nirvana (band)" } } },
            },
        })
        expect(await makeClient(fetch).resolveTitle("Q11649")).toBe("Nirvana (band)")

        const url = requestUrl(fetch)
        expect(url.origin + url.pathname).toBe("https://www.wikidata.org/w/api.php")
        expect(url.searchParams.get("action")).toBe("wbgetentities")
        expect(url.searchParams.get("sitefilter")).toBe("enwiki")
        expect(url.searchParams.get("origin")).toBe("*")
        expect(fetch.mock.calls[0][1]?.headers).toHaveProperty("Api-User-Agent")
    })

    it("is null when the item has no English article", async () => {
        const fetch = respondWith({ entities: { Q1: { sitelinks: {} } } })
        expect(await makeClient(fetch).resolveTitle("Q1")).toBeNull()
    })

    it("reads the lead section, description and thumbnail", async () => {
        const fetch = respondWith({
            query: {
                pages: [
                    {
                        title: "Nirvana (band)",
                        extract: "Nirvana was an American rock band.\n\nIt formed in 1987.",
                        description: "American rock band",
                        thumbnail: {
                            source: "https://upload.wikimedia.org/x.jpg",
                            width: 320,
                            height: 200,
                        },
                    },
                ],
            },
        })
        const prose = await makeClient(fetch).getArticle("Nirvana (band)")

        expect(prose).toEqual({
            source: "wikipedia",
            text: "Nirvana was an American rock band.\n\nIt formed in 1987.",
            title: "Nirvana (band)",
            description: "American rock band",
            thumbnailUrl: "https://upload.wikimedia.org/x.jpg",
            sourceUrl: "https://en.wikipedia.org/wiki/Nirvana_(band)",
        })
        const url = requestUrl(fetch)
        expect(url.origin + url.pathname).toBe("https://en.wikipedia.org/w/api.php")
        expect(url.searchParams.get("prop")).toBe("extracts|pageimages|description")
        expect(url.searchParams.get("exintro")).toBe("1")
        expect(url.searchParams.get("explaintext")).toBe("1")
        expect(url.searchParams.get("redirects")).toBe("1")
        expect(url.searchParams.get("titles")).toBe("Nirvana (band)")
        expect(url.searchParams.get("formatversion")).toBe("2")
    })

    it("links to the title the article resolved to", async () => {
        const fetch = respondWith({
            query: { pages: [{ title: "Dave Grohl", extract: "Drummer." }] },
        })
        const prose = await makeClient(fetch).getArticle("David Grohl")
        expect(prose?.sourceUrl).toBe("https://en.wikipedia.org/wiki/Dave_Grohl")
    })

    it("is null for a missing page", async () => {
        const fetch = respondWith({ query: { pages: [{ title: "Nope", missing: true }] } })
        expect(await makeClient(fetch).getArticle("Nope")).toBeNull()
    })

    it("wraps network failures", async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError("offline")
        })
        await expect(
            makeClient(fetch as unknown as FetchMock).resolveTitle("Q1"),
        ).rejects.toBeInstanceOf(WikipediaNetworkError)
    })
})
