import { useCallback } from "react"

import { songResourceToPlayableItem } from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import type { SongResource } from "@/musickit/models/song"

/** Returns a function which replaces the player's queue with songs, starting at `startingSong` if given */
export default function usePlaySongs() {
    const extensionHost = useExtensionHost()
    return useCallback(
        async (songs: readonly SongResource[], startingSong?: SongResource) => {
            const player = await extensionHost.player()
            await player.replaceQueue({
                newQueueItems: songs.map(songResourceToPlayableItem),
                startingItem: startingSong && songResourceToPlayableItem(startingSong),
                playNow: true,
            })
        },
        [extensionHost],
    )
}
