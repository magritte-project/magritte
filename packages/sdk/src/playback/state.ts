import z4 from "zod"

export const RepeatModeSchema = z4.enum(["off", "one", "all"])
export type RepeatMode = z4.infer<typeof RepeatModeSchema>

export const ShuffleModeSchema = z4.enum(["off", "on"])
export type ShuffleMode = z4.infer<typeof ShuffleModeSchema>

export const PlaybackModesSchema = z4
    .object({
        repeat: RepeatModeSchema,
        shuffle: ShuffleModeSchema,
    })
    .readonly()
export type PlaybackModes = z4.infer<typeof PlaybackModesSchema>

export const PlaybackStateSchema = z4.enum(["playing", "paused", "stopped"])
export type PlaybackState = z4.infer<typeof PlaybackStateSchema>
