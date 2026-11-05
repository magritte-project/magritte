import type { API } from "@magritte/api"

import type { Player } from "@/playback/player"
import { justEventsMatching } from "@/utilities/events"

export function wireUpPlayerUserSession(api: API, player: Player) {
    api.userSessionManager.subscribe(
        justEventsMatching("type", "currentChanged", () => {
            if (!api.userSessionManager.isSignedIn && player.playbackState !== "stopped") {
                void player.stop()
            }
        }),
    )
}
