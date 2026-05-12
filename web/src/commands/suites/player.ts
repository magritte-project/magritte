import type { CommandDefinition } from "@/commands/definition"
import { PlayerInput } from "@/commands/inputs/playerInput"
import type { Player } from "@/playback/player"

export function playerCommands(player: Player): CommandDefinition[] {
    return [
        {
            id: "playback.skipPrevious",
            searchTerms: "skip previous",
            displayName: () => "Skip Previous",
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.playPaused",
            searchTerms: "play pause",
            displayName: (inputs) => {
                const { playbackState } = inputs.only("player", PlayerInput)
                return playbackState === "playing" ? "Pause" : "Play"
            },
            disabled: (inputs) => {
                const { playbackState } = inputs.only("player", PlayerInput)
                return playbackState === "stopped"
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
            displayName: () => "Skip Next",
            execute: () => player.skipNext(),
        },
        {
            id: "playback.repeatOff",
            searchTerms: "repeat off",
            displayName: () => "Repeat Off",
            disabled: (inputs) => {
                const { playbackModes } = inputs.only("player", PlayerInput)
                return playbackModes.repeat === "off"
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off")),
        },
        {
            id: "playback.repeatAll",
            searchTerms: "repeat all",
            displayName: () => "Repeat All",
            disabled: (inputs) => {
                const { playbackModes } = inputs.only("player", PlayerInput)
                return playbackModes.repeat === "all"
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all")),
        },
        {
            id: "playback.repeatOne",
            searchTerms: "repeat one",
            displayName: () => "Repeat One",
            disabled: (inputs) => {
                const { playbackModes } = inputs.only("player", PlayerInput)
                return playbackModes.repeat === "one"
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one")),
        },
        {
            id: "playback.shuffleOff",
            searchTerms: "shuffle off",
            displayName: () => "Shuffle Off",
            disabled: (inputs) => {
                const { playbackModes } = inputs.only("player", PlayerInput)
                return playbackModes.shuffle === "off"
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withShuffle("off")),
        },
        {
            id: "playback.shuffleOn",
            searchTerms: "shuffle on",
            displayName: () => "Shuffle On",
            disabled: (inputs) => {
                const { playbackModes } = inputs.only("player", PlayerInput)
                return playbackModes.shuffle === "on"
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withShuffle("on")),
        },
    ]
}
