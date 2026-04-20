import type { CommandDefinition } from "@/commands/definition"
import type { Player } from "@/playback/player"

export function builtInCommands(player: Player): CommandDefinition[] {
    return [
        {
            id: "playback.skipPrevious",
            displayName: "Skip Previous",
            requires: [],
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.playPaused",
            displayName: player.playbackState === "playing" ? "Pause" : "Play",
            requires: [],
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.skipNext",
            displayName: "Skip Next",
            requires: [],
            execute: () => player.skipNext(),
        },
        {
            id: "playback.repeatOff",
            displayName: "Repeat Off",
            requires: [],
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off")),
        },
        {
            id: "playback.repeatAll",
            displayName: "Repeat All",
            requires: [],
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all")),
        },
        {
            id: "playback.repeatOne",
            displayName: "Repeat One",
            requires: [],
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one")),
        },
        {
            id: "playback.shuffleOff",
            displayName: "Shuffle Off",
            requires: [],
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withShuffle("off")),
        },
        {
            id: "playback.shuffleOn",
            displayName: "Shuffle On",
            requires: [],
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withShuffle("on")),
        },
    ]
}
