import { useQuery } from "@tanstack/react-query"

import { readWikipediaArticle, readWikipediaTitle } from "@/api/queries/wikipedia"
import useClients from "@/hooks/clientsHook"
import type { ExternalLinks, Prose } from "@/model/types"

export interface ProseFallback {
    readonly prose: Prose | null | undefined
    readonly isPending: boolean
}

export interface ProseState {
    readonly prose: Prose | null
    readonly isPending: boolean
}

export interface UseProseOptions {
    /**
     * Where to find a Wikipedia article. `undefined` while MusicBrainz is still
     * being asked, `null` when it has nothing to offer.
     */
    readonly links: ExternalLinks | null | undefined
    /** What to show when Wikipedia has nothing, typically Last.fm's bio or wiki */
    readonly fallback?: ProseFallback
}

/**
 * Something to read about an entity: its Wikipedia article when MusicBrainz
 * links to one, otherwise whatever the fallback offers. Pending only lasts
 * while a source that could still turn up something is being fetched.
 */
export default function useProse({ links, fallback }: UseProseOptions): ProseState {
    const { wikipedia } = useClients()
    // A direct Wikipedia link saves the trip through Wikidata
    const wikidataId = links?.wikipediaTitle === undefined ? links?.wikidataId : undefined
    const titleQuery = useQuery(readWikipediaTitle(wikipedia, wikidataId))
    const title = links?.wikipediaTitle ?? titleQuery.data ?? null
    const articleQuery = useQuery(readWikipediaArticle(wikipedia, title))

    if (links === undefined) {
        return { prose: null, isPending: true }
    }
    if (title === null ? titleQuery.isLoading : articleQuery.isLoading) {
        return { prose: null, isPending: true }
    }
    const article = articleQuery.data ?? null
    if (article !== null) {
        return { prose: article, isPending: false }
    }
    if (fallback?.isPending) {
        return { prose: null, isPending: true }
    }
    return { prose: fallback?.prose ?? null, isPending: false }
}
