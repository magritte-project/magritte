import type { RPCBroadcaster } from "@magritte/rpc"
import {
    PlayerProtocol as ExtensionPlayerProtocol,
    type Player as ExtensionPlayer,
} from "@magritte/sdk"

import type { Player as HostPlayer } from "@/playback/player"
import ArrayQueue from "@/playback/queue/array"

export function exportPlayer(broadcaster: RPCBroadcaster, player: HostPlayer): ExtensionPlayer {
    const subscription = player.$events.subscribe(async (event) => {
        switch (event.type) {
            case "playbackStateDidChange":
            case "playingItemChanged":
                broadcaster.send("nowPlayingDidChange", ExtensionPlayerProtocol.name)
                break
            default:
                break
        }
    })
    broadcaster.addEventListener("invalidated", () => {
        subscription.unsubscribe()
    })
    return {
        getCurrentTime: async () => {
            return await player.getCurrentTime()
        },

        seek: async ({ newTime }) => {
            await player.seek(newTime)
        },

        getNowPlaying: async () => {
            return {
                state: player.playbackState,
                item: player.playingItem,
            }
        },

        replaceQueue: async ({ newQueueItems, startingItem, playNow }) => {
            await player.replaceQueue({
                newQueue: new ArrayQueue(newQueueItems),
                startingItem,
                playNow,
            })
        },

        pause: async () => {
            await player.pause()
        },

        resume: async () => {
            await player.resume()
        },

        skipPrevious: async () => {
            await player.skipPrevious()
        },

        skipNext: async () => {
            await player.skipNext()
        },
    }
}
