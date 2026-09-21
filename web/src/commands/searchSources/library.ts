import type { API } from "@magritte/api"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { Player } from "@/playback/player"

export interface LibrarySearchSourceOptions {
    readonly router: RegisteredRouter
    readonly api: API
    readonly player: Player
}
