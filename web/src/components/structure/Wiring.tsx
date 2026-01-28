import type { ReactNode } from "react"

import { useQueryClient } from "@tanstack/react-query"

import { library } from "@/api/keys/libraries"
import { userMeNotification, userMeNotifications } from "@/api/keys/users"
import useUserEvents from "@/hooks/userEventsHook"

export interface WiringProps {
    readonly children?: ReactNode
}

export default function Wiring({ children }: WiringProps) {
    const queryClient = useQueryClient()
    useUserEvents({
        onEvent: async (event) => {
            // TODO: This is nastier than it probably needs to be
            switch (event.event_type) {
                case "notifications_changed":
                    await queryClient.invalidateQueries({
                        queryKey: userMeNotifications(),
                        exact: false,
                    })
                    for (const notificationId of event.ids) {
                        await queryClient.invalidateQueries({
                            queryKey: userMeNotification(notificationId),
                        })
                    }
                    break
                case "libraries_changed":
                    if (event.event_type === "libraries_changed") {
                        for (const libraryId of event.ids) {
                            await queryClient.invalidateQueries({
                                queryKey: library(libraryId),
                                exact: false,
                            })
                        }
                    }
                    break
            }
        },
    })

    return <>{children}</>
}
