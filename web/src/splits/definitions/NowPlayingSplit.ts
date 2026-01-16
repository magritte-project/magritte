import { WaveformIcon } from "@phosphor-icons/react"

import NowPlaying from "@/components/NowPlaying"

import type { SplitDefinition } from "../base"

export const NowPlayingSplit: SplitDefinition = {
    id: "nowPlaying",
    name: "Now Playing",
    icon: WaveformIcon,
    minWidth: "16rem",
    preferredLocation: "end",
    allowsMultiple: false,
    component: NowPlaying,
}
