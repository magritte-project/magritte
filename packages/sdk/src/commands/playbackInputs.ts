import z4 from "zod"

import { PlayableItemSchema } from "../playback/items"
import { PlaybackModesSchema, PlaybackStateSchema } from "../playback/state"
import { CommandInputSchema, onlyOne } from "./inputs"

export const PlaybackStateInputSchema = CommandInputSchema.extend({
    kind: z4.literal("playbackState").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlaybackStateSchema,
})
export type PlaybackStateInput = z4.infer<typeof PlaybackStateInputSchema>

export const PlaybackModesInputSchema = CommandInputSchema.extend({
    kind: z4.literal("playbackModes").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlaybackModesSchema,
})
export type PlaybackModesInput = z4.infer<typeof PlaybackModesInputSchema>

export const PlayingItemInputSchema = CommandInputSchema.extend({
    kind: z4.literal("playingItem").readonly(),
    id: z4.literal(onlyOne).readonly(),
    current: PlayableItemSchema,
})
export type PlayingItemInput = z4.infer<typeof PlayingItemInputSchema>
