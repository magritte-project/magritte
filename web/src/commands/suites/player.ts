import { getCommandInputKind } from "@magritte/sdk"

import type { Command } from "@/commands/base"
import type { Player } from "@/playback/player"

import { PlaybackModesInput, PlaybackStateInput } from "../inputs/playerInput"

export function playerCommands(player: Player): Command[] {
    return [
        {
            id: "playback.skipPrevious",
            searchTerms: "playback skip previous",
            requiredInputKinds: [getCommandInputKind(PlaybackStateInput)],
            present: async () => ({ displayName: "playback: Skip Previous", disabled: false }),
            execute: () => player.skipPrevious(),
        },
        {
            id: "playback.playPaused",
            searchTerms: "playback play pause",
            requiredInputKinds: [getCommandInputKind(PlaybackStateInput)],
            present: async (inputs) => {
                const { current } = inputs.only(PlaybackStateInput)
                return {
                    displayName: current === "playing" ? "playback: Pause" : "playback: Play",
                    disabled: current === "stopped",
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
            requiredInputKinds: [getCommandInputKind(PlaybackStateInput)],
            present: async () => ({ displayName: "playback: Skip Next", disabled: false }),
            execute: () => player.skipNext(),
        },
        {
            id: "playback.repeatOff",
            searchTerms: "playback repeat off",
            requiredInputKinds: [getCommandInputKind(PlaybackModesInput)],
            present: async (inputs) => {
                const { current } = inputs.only(PlaybackModesInput)
                return {
                    displayName: "playback: Repeat Off",
                    disabled: current.repeat === "off",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off")),
        },
        {
            id: "playback.repeatAll",
            searchTerms: "playback repeat all",
            requiredInputKinds: [getCommandInputKind(PlaybackModesInput)],
            present: async (inputs) => {
                const { current } = inputs.only(PlaybackModesInput)
                return {
                    displayName: "playback: Repeat All",
                    disabled: current.repeat === "all",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all")),
        },
        {
            id: "playback.repeatOne",
            searchTerms: "playback repeat one",
            requiredInputKinds: [getCommandInputKind(PlaybackModesInput)],
            present: async (inputs) => {
                const { current } = inputs.only(PlaybackModesInput)
                return {
                    displayName: "playback: Repeat One",
                    disabled: current.repeat === "one",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one")),
        },
        {
            id: "playback.shuffleOnOff",
            searchTerms: "playback shuffle on off toggle",
            requiredInputKinds: [getCommandInputKind(PlaybackModesInput)],
            present: async (inputs) => {
                const { current } = inputs.only(PlaybackModesInput)
                return {
                    displayName:
                        current.shuffle === "on" ? "playback: Shuffle Off" : "playback: Shuffle On",
                }
            },
            execute: () =>
                player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle()),
        },
    ]
}
