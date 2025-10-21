import type { Player } from "@/playback/player"
import { createContext } from "react"

export const PlayerContext = createContext<Player | undefined>(undefined)
