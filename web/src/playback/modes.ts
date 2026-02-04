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

    withNextRepeat(): PlaybackModes {
        switch (this.repeat) {
            case "off":
                return this.withRepeat("one")
            case "one":
                return this.withRepeat("all")
            case "all":
                return this.withRepeat("off")
        }
    }

    withShuffle(shuffle: ShuffleMode): PlaybackModes {
        return new PlaybackModes(this.repeat, shuffle)
    }

    withNextShuffle(): PlaybackModes {
        switch (this.shuffle) {
            case "off":
                return this.withShuffle("on")
            case "on":
                return this.withShuffle("off")
        }
    }

    toString(): string {
        return `PlaybackModes{ repeat: ${this.repeat}, shuffle: ${this.shuffle} }`
    }
}
