import { useContext } from "react"

import type { Player } from "@/playback/player"

import { PlayerContext } from "@/contexts/playerContext"

export default function usePlayer(): Player {
    const player = useContext(PlayerContext)
    if (player === undefined) {
        throw new Error("usePlayer() used outside of <PlayerContextProvider>")
    }
    return player
}
