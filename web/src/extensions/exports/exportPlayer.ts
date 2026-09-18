import type { ExtensionManifest } from "@magritte/api"
import { RPCBroadcaster } from "@magritte/rpc"
import { PlayerNowPlayingDidChange, type Player as ExtensionPlayer } from "@magritte/sdk"

import { enforcePermissions } from "@/extensions/exports/permissions"
import type { Player as HostPlayer } from "@/playback/player"
import ArrayQueue from "@/playback/queue/array"

export function exportPlayer(
    manifest: ExtensionManifest,
    broadcaster: RPCBroadcaster,
    player: HostPlayer,
): ExtensionPlayer {
    if (manifest.permissions?.includes("playback:read")) {
        const unsubscribe = player.subscribe(async (event) => {
            switch (event.type) {
                case "playbackStateDidChange":
                case "playingItemChanged":
                    broadcaster.send(PlayerNowPlayingDidChange, undefined)
                    break
                default:
                    break
            }
        })
        broadcaster.subscribe(RPCBroadcaster.invalidated, () => {
            unsubscribe()
        })
    }
    return {
        getCurrentTime: enforcePermissions(manifest, ["playback:read"], async () => {
            return await player.getCurrentTime()
        }),

        seek: enforcePermissions(manifest, ["playback:control"], async ({ newTime }) => {
            await player.seek(newTime)
        }),

        getNowPlaying: enforcePermissions(manifest, ["playback:read"], async () => {
            return {
                state: player.playbackState,
                item: player.playingItem,
            }
        }),

        replaceQueue: enforcePermissions(
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

        pause: enforcePermissions(manifest, ["playback:control"], async () => {
            await player.pause()
        }),

        resume: enforcePermissions(manifest, ["playback:control"], async () => {
            await player.resume()
        }),

        skipPrevious: enforcePermissions(manifest, ["playback:control"], async () => {
            await player.skipPrevious()
        }),

        skipNext: enforcePermissions(manifest, ["playback:control"], async () => {
            await player.skipNext()
        }),
    }
}
