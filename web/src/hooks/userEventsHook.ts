import type { EventCallback } from "@magritte/sdk"
import { useRouteContext } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import type { UserEvent } from "@/api/userEvents"

export interface UseUserEventsOptions {
    readonly onEvent?: EventCallback<UserEvent>
}

export interface UseUserEventsResult {
    readonly lastEvent: UserEvent | null
}

export default function useUserEvents({ onEvent }: UseUserEventsOptions = {}): UseUserEventsResult {
    const userEvents = useRouteContext({
        from: "__root__",
        select: (context) => context.userEvents,
    })
    const [lastEvent, setLastEvent] = useState<UserEvent | null>(null)
    useEffect(() => {
        const subcription = userEvents.$events.subscribe(async (event) => {
            await onEvent?.(event)
            setLastEvent(event)
        })
        return () => {
            subcription.unsubscribe()
        }
    }, [userEvents.$events, onEvent])
    return { lastEvent }
}
