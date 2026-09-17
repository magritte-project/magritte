import type { ExtensionHost } from "@magritte/sdk"
import { queryOptions } from "@tanstack/react-query"

import { librarySources } from "@/api/keys/librarySources"
import { BatchLoader } from "@/utilities/batchLoader"

/** The maximum number of extension tags looked up in a single page */
const lookupBatchSize = 200

const sourceLoaders = new WeakMap<ExtensionHost, BatchLoader<string, boolean>>()

function getSourceLoader(extensionHost: ExtensionHost) {
    let loader = sourceLoaders.get(extensionHost)
    if (loader === undefined) {
        loader = new BatchLoader(async (extensionTags) => {
            const library = await extensionHost.library()
            const { items } = await library.readExtensionSources({
                extensionTags: [...extensionTags],
                limit: lookupBatchSize,
            })
            const foundTags = new Set(
                items.flatMap((item) => (item.extension_tag ? [item.extension_tag] : [])),
            )
            return new Map(extensionTags.map((tag) => [tag, foundTags.has(tag)]))
        }, lookupBatchSize)
        sourceLoaders.set(extensionHost, loader)
    }
    return loader
}

/** Find which of the given songs' extension tags have not been ingested by this extension yet */
export async function readTagsMissingFromLibrary(
    extensionHost: ExtensionHost,
    extensionTags: readonly string[],
): Promise<Set<string>> {
    const loader = getSourceLoader(extensionHost)
    const found = await Promise.all(extensionTags.map((tag) => loader.load(tag)))
    return new Set(extensionTags.filter((_, index) => !found[index]))
}

/** Whether every one of the given songs has already been ingested by this extension, in any library */
export function readIsAlreadyIngested(
    extensionHost: ExtensionHost,
    extensionTags: readonly string[],
) {
    return queryOptions({
        queryKey: librarySources(extensionTags),
        queryFn: async () => {
            const missing = await readTagsMissingFromLibrary(extensionHost, extensionTags)
            return missing.size === 0
        },
    })
}
