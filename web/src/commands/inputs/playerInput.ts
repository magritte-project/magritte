import { PlaybackModes } from "@magritte/sdk/extension"
import { PlayableItem, PlaybackState } from "@magritte/sdk/host"
import z4 from "zod"

import { CommandInputs, SingletonCommandInput } from "@/commands/inputs/base"
import type { Player } from "@/playback/player"

export const PlayerInput = SingletonCommandInput.extend({
    kind: z4.literal("player"),
    playbackState: PlaybackState,
    playbackModes: PlaybackModes,
    playingItem: z4.union([PlayableItem, z4.null()]),
})
export type PlayerInput = z4.infer<typeof PlayerInput>

export function wirePlayerInput(player: Player, inputs: CommandInputs) {
    function updatePlayerInput() {
        inputs.add(PlayerInput, {
            kind: "player",
            id: "__onlyOne__",
            playbackState: player.playbackState,
            playbackModes: player.playbackModes,
            playingItem: player.playingItem,
        })
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
