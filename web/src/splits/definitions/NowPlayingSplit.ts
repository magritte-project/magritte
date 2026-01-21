import { WaveformIcon } from "@phosphor-icons/react"

import type { SplitDefinition } from "@/splits/base"

import NowPlaying from "@/components/NowPlaying"

export const NowPlayingSplit: SplitDefinition = {
    id: "nowPlaying",
    name: "Now Playing",
    icon: WaveformIcon,
    minWidth: "16rem",
    preferredLocation: "end",
    allowsMultiple: false,
    requiresParameters: false,
    component: NowPlaying,
}
