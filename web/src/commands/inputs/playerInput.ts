import { CommandInput, onlyOne, PlayableItem, PlaybackModes, PlaybackState } from "@magritte/sdk"
import z4 from "zod"

import type { CommandInputs } from "@/commands/inputs/base"
import type { Player } from "@/playback/player"

export const PlayerInput = CommandInput.extend({
    kind: z4.literal("player").readonly(),
    id: z4.literal(onlyOne).readonly(),
    playbackState: PlaybackState,
    playbackModes: PlaybackModes,
    playingItem: z4.union([PlayableItem, z4.null()]),
})
export type PlayerInput = z4.infer<typeof PlayerInput>

export function wirePlayerInput(player: Player, inputs: CommandInputs) {
    function updatePlayerInput() {
        inputs.add({
            kind: "player",
            id: onlyOne,
            playbackState: player.playbackState,
            playbackModes: { ...player.playbackModes },
            playingItem: player.playingItem,
        } satisfies PlayerInput)
    }
    updatePlayerInput()
    player.$events.subscribe((event) => {
        switch (event.type) {
            case "playbackStateDidChange":
            case "playbackModesDidChange":
            case "playingItemChanged":
                updatePlayerInput()
                break
            default:
                break
        }
    })
}
