import { PlayerNowPlayingDidChange, type NowPlaying } from "@magritte/sdk"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { nowPlaying } from "@/api/keys/nowPlaying"
import { readHostNowPlaying } from "@/api/queries/nowPlaying"
import useExtensionHost from "@/hooks/extensionHostHook"

/**
 * What the host is playing right now.
 *
 * Returns `null` while the host has not been asked yet, or when the user has
 * not granted permission to read playback.
 */
export default function useHostNowPlaying(): NowPlaying | null {
    const extensionHost = useExtensionHost()
    const queryClient = useQueryClient()
    useEffect(() => {
        const { broadcaster } = extensionHost.connection
        if (!broadcaster.isValid) {
            return
        }
        const subscription = broadcaster.subscribe(PlayerNowPlayingDidChange, () => {
            void queryClient.invalidateQueries({ queryKey: nowPlaying() })
        })
        return () => subscription.unsubscribe()
    }, [extensionHost, queryClient])

    const nowPlayingQuery = useQuery(readHostNowPlaying(extensionHost))
    return nowPlayingQuery.data ?? null
}
