import type { Prose } from "@/model/types"

/** How this extension identifies itself, which Wikimedia asks API clients to do */
const API_USER_AGENT = "MagritteLinerNotes/0.0.0 (https://github.com/jkantr/magritte)"

/** How wide a thumbnail to ask for, comfortably above the panel's needs */
const THUMBNAIL_WIDTH = 320

export class WikipediaNetworkError extends Error {
    constructor(cause: unknown) {
        super("Could not reach Wikipedia", { cause })
        this.name = "WikipediaNetworkError"
    }
}

export interface WikipediaClientOptions {
    /** Overridable so tests do not have to touch the network */
    readonly fetch?: typeof globalThis.fetch
    readonly language?: string
}

/** Wikipedia titles use underscores for spaces, and the rest is percent-encoded */
export function encodeTitle(title: string): string {
    return encodeURIComponent(title.trim().replace(/ /g, "_"))
}

export class WikipediaClient {
    private readonly _fetch: typeof globalThis.fetch
    private readonly _language: string

    constructor({ fetch = globalThis.fetch, language = "en" }: WikipediaClientOptions = {}) {
        // Bound so the default `fetch` is not called with the wrong receiver
        this._fetch = fetch.bind(globalThis)
        this._language = language
    }

    articleUrl(title: string): string {
        return `https://${this._language}.wikipedia.org/wiki/${encodeTitle(title)}`
    }

    private async _get(root: string, parameters: Record<string, string>): Promise<any> {
        const url = new URL(root)
        for (const [name, value] of Object.entries(parameters)) {
            url.searchParams.set(name, value)
        }
        url.searchParams.set("format", "json")
        // `origin=*` is how Wikimedia's action APIs opt into anonymous CORS
        url.searchParams.set("origin", "*")
        let response: Response
        try {
            response = await this._fetch(url, {
                method: "GET",
                headers: { "Api-User-Agent": API_USER_AGENT },
            })
        } catch (error) {
            throw new WikipediaNetworkError(error)
        }
        if (!response.ok) {
            throw new Error(`Wikipedia responded with ${response.status}`)
        }
        return await response.json()
    }

    /** The title of the article a Wikidata item links to, in this client's language */
    async resolveTitle(wikidataId: string): Promise<string | null> {
        const site = `${this._language}wiki`
        const payload = await this._get("https://www.wikidata.org/w/api.php", {
            action: "wbgetentities",
            ids: wikidataId,
            props: "sitelinks",
            sitefilter: site,
        })
        const title = payload?.entities?.[wikidataId]?.sitelinks?.[site]?.title
        return typeof title === "string" && title.length > 0 ? title : null
    }

    /** The lead section of an article as plain text, with its thumbnail */
    async getArticle(title: string): Promise<Prose | null> {
        const payload = await this._get(`https://${this._language}.wikipedia.org/w/api.php`, {
            action: "query",
            prop: "extracts|pageimages|description",
            exintro: "1",
            explaintext: "1",
            piprop: "thumbnail",
            pithumbsize: String(THUMBNAIL_WIDTH),
            redirects: "1",
            titles: title,
            formatversion: "2",
        })
        const page = payload?.query?.pages?.[0]
        const extract = typeof page?.extract === "string" ? page.extract.trim() : ""
        if (page?.missing === true || extract.length === 0) {
            return null
        }
        const resolvedTitle = typeof page.title === "string" ? page.title : title
        return {
            source: "wikipedia",
            text: extract,
            title: resolvedTitle,
            description: typeof page.description === "string" ? page.description : undefined,
            thumbnailUrl:
                typeof page.thumbnail?.source === "string" ? page.thumbnail.source : undefined,
            sourceUrl: this.articleUrl(resolvedTitle),
        }
    }
}
