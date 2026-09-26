import type { ExtensionHost, NowPlaying } from "@magritte/sdk"
import { queryOptions } from "@tanstack/react-query"

import { nowPlaying } from "@/api/keys/nowPlaying"

export function readHostNowPlaying(extensionHost: ExtensionHost) {
    return queryOptions({
        queryKey: nowPlaying(),
        queryFn: async (): Promise<NowPlaying> => {
            const player = await extensionHost.player()
            return await player.getNowPlaying()
        },
    })
}
