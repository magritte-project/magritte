import type { Player as ExtensionPlayer } from "@magritte/sdk/host"

import type { Player as HostPlayer } from "@/playback/player"

export function exportPlayer(player: HostPlayer): ExtensionPlayer {
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
