import type { RPCBroadcaster } from "@magritte/rpc"
import {
    ExtensionManifest,
    PlayerProtocol as ExtensionPlayerProtocol,
    type Player as ExtensionPlayer,
} from "@magritte/sdk"

import { checkPermissions } from "@/extensions/exports/permissions"
import type { Player as HostPlayer } from "@/playback/player"
import ArrayQueue from "@/playback/queue/array"

export function exportPlayer(
    manifest: ExtensionManifest,
    broadcaster: RPCBroadcaster,
    player: HostPlayer,
): ExtensionPlayer {
    if (manifest.permissions?.includes("playback:read")) {
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
    }
    return {
        getCurrentTime: checkPermissions(manifest, ["playback:read"], async () => {
            return await player.getCurrentTime()
        }),

        seek: checkPermissions(manifest, ["playback:control"], async ({ newTime }) => {
            await player.seek(newTime)
        }),

        getNowPlaying: checkPermissions(manifest, ["playback:read"], async () => {
            return {
                state: player.playbackState,
                item: player.playingItem,
            }
        }),

        replaceQueue: checkPermissions(
            manifest,
            ["playback:control"],
            async ({ newQueueItems, startingItem, playNow }) => {
                await player.replaceQueue({
                    newQueue: new ArrayQueue(newQueueItems),
                    startingItem,
                    playNow,
                })
            },
        ),

        pause: checkPermissions(manifest, ["playback:control"], async () => {
            await player.pause()
        }),

        resume: checkPermissions(manifest, ["playback:control"], async () => {
            await player.resume()
        }),

        skipPrevious: checkPermissions(manifest, ["playback:control"], async () => {
            await player.skipPrevious()
        }),

        skipNext: checkPermissions(manifest, ["playback:control"], async () => {
            await player.skipNext()
        }),
    }
}
