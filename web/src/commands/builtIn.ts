import type { RegisteredRouter } from "@tanstack/react-router"

import type { CommandDefinition } from "@/commands/definition"
import type { Player } from "@/playback/player"

import { PlayerInput } from "@/commands/inputs/playerInput"

import { LibraryInput } from "./inputs/libraryInput"

export function builtInCommands(router: RegisteredRouter, player: Player): CommandDefinition[] {
    return [
        // Library Commands:
        {
            id: `libraries.artists`,
            searchTerms: "library artists",
            displayName: () => "Go to Artists",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
            execute: async (inputs) => {
                const [libraryId] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/artists",
                    params: { libraryId: String(libraryId) },
                })
            },
        },
        {
            id: `libraries.albums`,
            searchTerms: "library albums",
            displayName: () => "Go to Albums",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/albums",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.songs`,
            searchTerms: "library songs",
            displayName: () => "Go to Songs",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/songs",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.add.songs`,
            searchTerms: "library add songs",
            displayName: () => "Add Songs",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/songs/add",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        // Player Commands:
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
