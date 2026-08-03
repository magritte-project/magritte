import { useEffect, useState } from "react"

import type { UserEvent } from "@/api/userEvents"
import type { EventCallback } from "@/utilities/events"

import useAPI from "./apiHook"

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
