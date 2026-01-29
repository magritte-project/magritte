export type RepeatMode = "off" | "one" | "all"
export type ShuffleMode = "off" | "on"

export class PlaybackModes {
    static readonly default = new PlaybackModes()

    private constructor(
        readonly repeat: RepeatMode = "off",
        readonly shuffle: ShuffleMode = "off",
    ) {}

    withRepeat(repeat: RepeatMode): PlaybackModes {
        return new PlaybackModes(repeat, this.shuffle)
    }

    withShuffle(shuffle: ShuffleMode): PlaybackModes {
        return new PlaybackModes(this.repeat, shuffle)
    }

    toString(): string {
        return `PlaybackModes{ repeat: ${this.repeat}, shuffle: ${this.shuffle} }`
    }
}
