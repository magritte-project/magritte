import type { ExtensionHost } from "@magritte/sdk"
import { queryOptions } from "@tanstack/react-query"

import { librarySources } from "@/api/keys/librarySources"
import { BatchLoader } from "@/utilities/batchLoader"

/** The maximum number of URLs the host accepts in a single lookup */
const lookupBatchSize = 500

const sourceLoaders = new WeakMap<ExtensionHost, Map<number, BatchLoader<string, boolean>>>()

function getSourceLoader(extensionHost: ExtensionHost, libraryId: number) {
    let loaders = sourceLoaders.get(extensionHost)
    if (loaders === undefined) {
        loaders = new Map()
        sourceLoaders.set(extensionHost, loaders)
    }
    let loader = loaders.get(libraryId)
    if (loader === undefined) {
        loader = new BatchLoader(async (urls) => {
            const library = await extensionHost.library()
            const foundUrls = new Set(
                await library.lookupSongSources({ libraryId, urls: [...urls] }),
            )
            return new Map(urls.map((url) => [url, foundUrls.has(url)]))
        }, lookupBatchSize)
        loaders.set(libraryId, loader)
    }
    return loader
}

/** Find which source URLs do not belong to songs in a library yet */
export async function readSourcesMissingFromLibrary(
    extensionHost: ExtensionHost,
    libraryId: number,
    urls: readonly string[],
): Promise<Set<string>> {
    const loader = getSourceLoader(extensionHost, libraryId)
    const found = await Promise.all(urls.map((url) => loader.load(url)))
    return new Set(urls.filter((_, index) => !found[index]))
}

/** Find which libraries already contain songs for every one of the source URLs */
export function readLibrariesContainingSources(
    extensionHost: ExtensionHost,
    libraryIds: readonly number[],
    urls: readonly string[],
) {
    return queryOptions({
        queryKey: librarySources(libraryIds, urls),
        queryFn: async () => {
            const containingIds = await Promise.all(
                libraryIds.map(async (libraryId) => {
                    const missing = await readSourcesMissingFromLibrary(
                        extensionHost,
                        libraryId,
                        urls,
                    )
                    return missing.size === 0 ? libraryId : null
                }),
            )
            return containingIds.filter((libraryId): libraryId is number => libraryId !== null)
        },
    })
}
