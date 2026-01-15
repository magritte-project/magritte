import { useRouteContext } from "@tanstack/react-router"

import type { Player } from "@/playback/player"

export default function usePlayer(): Player {
    const player = useRouteContext({
        from: "__root__",
        select: (context) => context.player,
    })
    return player
}
