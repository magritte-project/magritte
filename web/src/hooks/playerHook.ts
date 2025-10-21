import { PlayerContext } from "@/contexts/playerContext"
import type { Player } from "@/playback/player"
import { useContext } from "react"

export default function usePlayer(): Player {
    const player = useContext(PlayerContext)
    if (player === undefined) {
        throw new Error("usePlayer() used outside of <PlayerContextProvider>")
    }
    return player
}
