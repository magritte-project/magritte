export type RepeatMode = "off" | "one" | "all"
export type ShuffleMode = "off" | "on"

export interface PlaybackModes {
    readonly repeat: RepeatMode
    readonly shuffle: ShuffleMode
}

export const defaultPlaybackModes: PlaybackModes = {
    repeat: "off",
    shuffle: "off",
}

export function withNextRepeat(prev: PlaybackModes): PlaybackModes {
    switch (prev.repeat) {
        case "off":
            return { ...prev, repeat: "all" }
        case "all":
            return { ...prev, repeat: "one" }
        case "one":
            return { ...prev, repeat: "off" }
    }
}

export function withNextShuffle(prev: PlaybackModes): PlaybackModes {
    switch (prev.shuffle) {
        case "off":
            return { ...prev, shuffle: "on" }
        case "on":
            return { ...prev, shuffle: "off" }
    }
}
