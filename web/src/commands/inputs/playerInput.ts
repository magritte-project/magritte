import {
    CommandInput,
    getCommandInputKind,
    onlyOne,
    PlayableItem,
    PlaybackModes,
    PlaybackState,
} from "@magritte/sdk"
import z4 from "zod"

import type { CommandInputs } from "@/commands/inputs/base"
import type { Player } from "@/playback/player"

export const PlaybackStateInput = CommandInput.extend({
    kind: z4.literal("playbackState").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlaybackState,
})
export type PlaybackStateInput = z4.infer<typeof PlaybackStateInput>

export const PlaybackModesInput = CommandInput.extend({
    kind: z4.literal("playbackModes").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlaybackModes,
})
export type PlaybackModesInput = z4.infer<typeof PlaybackModesInput>

export const PlayingItemInput = CommandInput.extend({
    kind: z4.literal("playingItem").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlayableItem,
})
export type PlayingItemInput = z4.infer<typeof PlayingItemInput>

export function wirePlayerInput(player: Player, inputs: CommandInputs) {
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
    player.$events.subscribe((event) => {
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
