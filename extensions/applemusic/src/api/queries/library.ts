import type { ExtensionHost } from "@magritte/sdk/extension"
import { queryOptions } from "@tanstack/react-query"

import { libraries } from "@/api/keys/libraries"

export function readLibraries(extensionHost: ExtensionHost) {
    return queryOptions({
        queryKey: libraries(),
        queryFn: async () => {
            const library = await extensionHost.library()
            return library.readLibraries()
        },
    })
}
