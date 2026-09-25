import type { ExternalLinks, Relation } from "@/model/types"

function hostOf(url: string): string | undefined {
    try {
        return new URL(url).hostname.replace(/^www\./, "")
    } catch {
        return undefined
    }
}

/**
 * Pick the links worth following out of an entity's url relationships.
 *
 * MusicBrainz mostly stopped storing direct Wikipedia links in favour of
 * Wikidata, so the Wikidata id is what usually leads to an article.
 */
export function extractLinks(relations: readonly Relation[], musicbrainz: string): ExternalLinks {
    let links: ExternalLinks = { musicbrainz }
    for (const relation of relations) {
        if (relation.targetType !== "url" || relation.url === undefined) {
            continue
        }
        const url = relation.url
        const host = hostOf(url)
        switch (relation.type) {
            case "wikidata": {
                const id = /\/(Q\d+)(?:[/?#]|$)/.exec(url)?.[1]
                if (id !== undefined && links.wikidataId === undefined) {
                    links = { ...links, wikidataId: id }
                }
                break
            }
            case "wikipedia": {
                // Only English articles are shown, other languages are left to Wikidata
                const match = /^https?:\/\/en\.wikipedia\.org\/wiki\/(.+)$/.exec(url)
                if (match !== null && links.wikipediaTitle === undefined) {
                    links = { ...links, wikipediaTitle: decodeURIComponent(match[1]) }
                }
                break
            }
            case "last.fm":
            case "discography entry": {
                if (host === "last.fm" && links.lastfm === undefined) {
                    links = { ...links, lastfm: url }
                }
                break
            }
            case "discogs": {
                if (links.discogs === undefined) {
                    links = { ...links, discogs: url }
                }
                break
            }
            case "allmusic": {
                if (links.allmusic === undefined) {
                    links = { ...links, allmusic: url }
                }
                break
            }
            case "official homepage": {
                if (links.homepage === undefined) {
                    links = { ...links, homepage: url }
                }
                break
            }
            default: {
                break
            }
        }
    }
    return links
}
