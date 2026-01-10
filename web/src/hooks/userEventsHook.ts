import { useQueryClient } from "@tanstack/react-query"
import { parseServerSentEvents } from "parse-sse"
import { useEffect } from "react"

import type { UserEvent } from "@/api/openapi"

import { readNotification, readNotifications } from "@/api/queries/users"
import useAPIClient from "@/hooks/apiClientHook"
import useUserSession from "@/hooks/userSessionHook"

export default function useUserEvents() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    const { current } = useUserSession()
    useEffect(() => {
        if (!current?.accessToken) {
            return
        }
        let canceled = false
        ;(async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/users/events`, {
                    headers: { Authorization: `Bearer ${current.accessToken}` },
                })
                if (canceled) {
                    return
                }
                const events = parseServerSentEvents(response) as unknown as AsyncIterable<any>
                console.debug("Subscribed to user events...")
                for await (const event of events) {
                    if (canceled) {
                        break
                    }
                    if (event.type !== "message") {
                        console.error(`Unknown user event:`, event)
                        continue
                    }
                    try {
                        const userEvent = JSON.parse(event.data) as UserEvent
                        console.debug("Received user event:", userEvent)
                        switch (userEvent.event_type) {
                            case "notifications_changed":
                                await queryClient.invalidateQueries(readNotifications(apiClient))
                                for (const id of userEvent.ids) {
                                    await queryClient.invalidateQueries(
                                        readNotification(apiClient, id),
                                    )
                                }
                                break
                        }
                    } catch (error) {
                        console.error("*** Could not parse user event:", error)
                    }
                }
            } catch (error) {
                console.error("*** Could not listen for user events:", error)
            }
        })()
        return () => {
            console.debug("Unsubscribing from user events")
            canceled = true
        }
    }, [queryClient, apiClient, current?.accessToken])
}
