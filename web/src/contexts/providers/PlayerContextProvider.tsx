import type { ReactNode } from "react"

import type { Player } from "@/playback/player"

import { PlayerContext } from "@/contexts/playerContext"

export interface PlayerContextProviderProps {
    readonly value: Player
    readonly children?: ReactNode
}

export default function PlayerContextProvider({ value, children }: PlayerContextProviderProps) {
    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
