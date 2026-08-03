import type { UserEvent } from "@magritte/api"
import { useEffect, useState } from "react"

import useAPI from "@/hooks/apiHook"
import type { EventCallback } from "@/utilities/events"

export interface UseUserEventsOptions {
    readonly onEvent?: EventCallback<UserEvent>
}

export interface UseUserEventsResult {
    readonly lastEvent: UserEvent | null
}

export default function useUserEvents({ onEvent }: UseUserEventsOptions = {}): UseUserEventsResult {
    const { userEventsManager } = useAPI()
    const [lastEvent, setLastEvent] = useState<UserEvent | null>(null)
    useEffect(() => {
        return userEventsManager.subscribe(async (event) => {
            await onEvent?.(event)
            setLastEvent(event)
        })
    }, [userEventsManager, onEvent])
    return { lastEvent }
}
