import { createContext } from "react"

import type { Player } from "@/playback/player"

export const PlayerContext = createContext<Player | undefined>(undefined)
