import type { Command } from "@/commands/base"
import { PlayerInput } from "@/commands/inputs/playerInput"
import type { Player } from "@/playback/player"

export function playerCommands(player: Player): Command[] {
    return [
        {
            id: "playback.skipPrevious",
            searchTerms: "skip previous",
            present: async () => ({ displayName: "Skip Previous", disabled: false }),
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.playPaused",
            searchTerms: "play pause",
            present: async (inputs) => {
                const {
                    args: { playbackState },
                } = inputs.only("player", PlayerInput)
                return {
                    displayName: playbackState === "playing" ? "Pause" : "Play",
                    disabled: playbackState === "stopped",
                }
            },
            execute: async () => {
                if (player.playbackState === "playing") {
                    await player.pause()
                } else {
                    await player.resume()
                }
            },
        },
        {
            id: "playback.skipNext",
            searchTerms: "skip next",
            present: async () => ({ displayName: "Skip Next", disabled: false }),
            execute: () => player.skipNext(),
        },
        {
            id: "playback.repeatOff",
            searchTerms: "repeat off",
            present: async (inputs) => {
                const {
                    args: { playbackModes },
                } = inputs.only("player", PlayerInput)
                return { displayName: "Repeat Off", disabled: playbackModes.repeat === "off" }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off")),
        },
        {
            id: "playback.repeatAll",
            searchTerms: "repeat all",
            present: async (inputs) => {
                const {
                    args: { playbackModes },
                } = inputs.only("player", PlayerInput)
                return { displayName: "Repeat All", disabled: playbackModes.repeat === "all" }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all")),
        },
        {
            id: "playback.repeatOne",
            searchTerms: "repeat one",
            present: async (inputs) => {
                const {
                    args: { playbackModes },
                } = inputs.only("player", PlayerInput)
                return { displayName: "Repeat One", disabled: playbackModes.repeat === "one" }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one")),
        },
        {
            id: "playback.shuffleOnOff",
            searchTerms: "shuffle on off toggle",
            present: async (inputs) => {
                const {
                    args: { playbackModes },
                } = inputs.only("player", PlayerInput)
                return {
                    displayName: playbackModes.shuffle === "on" ? "Shuffle Off" : "Shuffle On",
                    disabled: false,
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle()),
        },
    ]
}
