import z4 from "zod"

export const RepeatMode = z4.enum(["off", "one", "all"])
export type RepeatMode = z4.infer<typeof RepeatMode>

export const ShuffleMode = z4.enum(["off", "on"])
export type ShuffleMode = z4.infer<typeof ShuffleMode>

export const PlaybackModes = z4
    .object({
        repeat: RepeatMode,
        shuffle: ShuffleMode,
    })
    .readonly()
export type PlaybackModes = z4.infer<typeof PlaybackModes>

export const PlaybackState = z4.enum(["playing", "paused", "stopped"])
export type PlaybackState = z4.infer<typeof PlaybackState>
