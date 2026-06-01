import type { Command } from "@/commands/base"
import { PlayerInput } from "@/commands/inputs/playerInput"
import type { Player } from "@/playback/player"

export function playerCommands(player: Player): Command[] {
    return [
        {
            id: "playback.skipPrevious",
            searchTerms: "playback skip previous",
            present: async () => ({ displayName: "playback: Skip Previous", disabled: false }),
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.playPaused",
            searchTerms: "playback play pause",
            present: async (inputs) => {
                const { playbackState } = inputs.only(PlayerInput)
                return {
                    displayName: playbackState === "playing" ? "playback: Pause" : "playback: Play",
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
            searchTerms: "playback skip next",
            present: async () => ({ displayName: "playback: Skip Next", disabled: false }),
            execute: () => player.skipNext(),
        },
        {
            id: "playback.repeatOff",
            searchTerms: "playback repeat off",
            present: async (inputs) => {
                const { playbackModes } = inputs.only(PlayerInput)
                return {
                    displayName: "playback: Repeat Off",
                    disabled: playbackModes.repeat === "off",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off")),
        },
        {
            id: "playback.repeatAll",
            searchTerms: "playback repeat all",
            present: async (inputs) => {
                const { playbackModes } = inputs.only(PlayerInput)
                return {
                    displayName: "playback: Repeat All",
                    disabled: playbackModes.repeat === "all",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all")),
        },
        {
            id: "playback.repeatOne",
            searchTerms: "playback repeat one",
            present: async (inputs) => {
                const { playbackModes } = inputs.only(PlayerInput)
                return {
                    displayName: "playback: Repeat One",
                    disabled: playbackModes.repeat === "one",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one")),
        },
        {
            id: "playback.shuffleOnOff",
            searchTerms: "playback shuffle on off toggle",
            present: async (inputs) => {
                const { playbackModes } = inputs.only(PlayerInput)
                return {
                    displayName:
                        playbackModes.shuffle === "on"
                            ? "playback: Shuffle Off"
                            : "playback: Shuffle On",
                    disabled: false,
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle()),
        },
    ]
}
