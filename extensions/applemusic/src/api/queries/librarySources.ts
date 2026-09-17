import type { ExtensionHost } from "@magritte/sdk"
import { queryOptions } from "@tanstack/react-query"

import { librarySources } from "@/api/keys/librarySources"
import { BatchLoader } from "@/utilities/batchLoader"

/** The maximum number of extension tags looked up in a single page */
const lookupBatchSize = 200

const sourceLoaders = new WeakMap<ExtensionHost, Map<number, BatchLoader<string, boolean>>>()

function getSourceLoader(extensionHost: ExtensionHost, libraryId: number) {
    let loaders = sourceLoaders.get(extensionHost)
    if (loaders === undefined) {
        loaders = new Map()
        sourceLoaders.set(extensionHost, loaders)
    }
    let loader = loaders.get(libraryId)
    if (loader === undefined) {
        loader = new BatchLoader(async (extensionTags) => {
            const library = await extensionHost.library()
            const { items } = await library.readExtensionSources({
                libraryId,
                extensionTags: [...extensionTags],
                limit: lookupBatchSize,
            })
            const foundTags = new Set(
                items.flatMap((item) => (item.extension_tag ? [item.extension_tag] : [])),
            )
            return new Map(extensionTags.map((tag) => [tag, foundTags.has(tag)]))
        }, lookupBatchSize)
        loaders.set(libraryId, loader)
    }
    return loader
}

/** Find which of the given songs' extension tags are missing from a library */
export async function readTagsMissingFromLibrary(
    extensionHost: ExtensionHost,
    libraryId: number,
    extensionTags: readonly string[],
): Promise<Set<string>> {
    const loader = getSourceLoader(extensionHost, libraryId)
    const found = await Promise.all(extensionTags.map((tag) => loader.load(tag)))
    return new Set(extensionTags.filter((_, index) => !found[index]))
}

/** Find which libraries already contain songs for every one of the given extension tags */
export function readLibrariesContainingTags(
    extensionHost: ExtensionHost,
    libraryIds: readonly number[],
    extensionTags: readonly string[],
) {
    return queryOptions({
        queryKey: librarySources(libraryIds, extensionTags),
        queryFn: async () => {
            const containingIds = await Promise.all(
                libraryIds.map(async (libraryId) => {
                    const missing = await readTagsMissingFromLibrary(
                        extensionHost,
                        libraryId,
                        extensionTags,
                    )
                    return missing.size === 0 ? libraryId : null
                }),
            )
            return containingIds.filter((libraryId): libraryId is number => libraryId !== null)
        },
    })
}
