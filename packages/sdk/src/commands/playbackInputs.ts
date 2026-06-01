import z4 from "zod"

import { PlaybackModes } from "../extension/playbackEngine"
import { PlayableItem, PlaybackState } from "../host/playback"
import { CommandInput, onlyOne } from "./inputs"

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
