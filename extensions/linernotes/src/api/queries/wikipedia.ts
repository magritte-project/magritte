import { queryOptions, skipToken } from "@tanstack/react-query"

import { wikipediaArticle, wikipediaTitle } from "@/api/keys/wikipedia"
import type { WikipediaClient } from "@/wikipedia/client"

const articleOptions = {
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
    retry: 1,
} as const

/** The English article for a Wikidata item, or null when it has none */
export function readWikipediaTitle(client: WikipediaClient, wikidataId: string | null | undefined) {
    return queryOptions({
        queryKey: wikipediaTitle(wikidataId ?? null),
        ...articleOptions,
        queryFn: wikidataId ? async () => await client.resolveTitle(wikidataId) : skipToken,
    })
}

export function readWikipediaArticle(client: WikipediaClient, title: string | null | undefined) {
    return queryOptions({
        queryKey: wikipediaArticle(title ?? null),
        ...articleOptions,
        queryFn: title ? async () => await client.getArticle(title) : skipToken,
    })
}
