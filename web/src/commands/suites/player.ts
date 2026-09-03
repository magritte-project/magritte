import {
    getCommandInputKind,
    onlyOne,
    PlaybackModesInput,
    PlaybackStateInput,
    PlayingItemInput,
} from "@magritte/sdk"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import { getMagritteRouterContext } from "@/integrations/tanstack-router/context"
import type { Player } from "@/playback/player"

export function playerCommands(router: RegisteredRouter): Command[] {
    return [
        {
            id: "playback.skipPrevious",
            searchTerms: "playback skip previous",
            requiredInputKinds: [getCommandInputKind(PlaybackStateInput)],
            present: async () => ({ displayName: "playback: Skip Previous", disabled: false }),
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.skipPrevious()
            },
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
                const { player } = getMagritteRouterContext(router)
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
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.skipNext()
            },
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
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("off"))
            },
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
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("all"))
            },
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
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.setPlaybackModes((playbackModes) => playbackModes.withRepeat("one"))
            },
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
            execute: async () => {
                const { player } = getMagritteRouterContext(router)
                await player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle())
            },
        },
    ]
}

export function wirePlayerCommandInputs(player: Player, inputs: CommandInputs) {
    function updatePlayerInputs() {
        inputs.add({
            kind: "playbackState",
            id: onlyOne,
            current: player.playbackState,
        } satisfies PlaybackStateInput)
        inputs.add({
            kind: "playbackModes",
            id: onlyOne,
            current: { ...player.playbackModes },
        } satisfies PlaybackModesInput)
        if (player.playingItem !== null) {
            inputs.add({
                kind: "playingItem",
                id: onlyOne,
                current: player.playingItem,
            } satisfies PlayingItemInput)
        } else {
            inputs.remove(getCommandInputKind(PlayingItemInput), onlyOne)
        }
    }
    updatePlayerInputs()
    player.$events((event) => {
        switch (event.type) {
            case "playbackStateDidChange":
            case "playbackModesDidChange":
            case "playingItemChanged":
                updatePlayerInputs()
                break
            default:
                break
        }
    })
}
