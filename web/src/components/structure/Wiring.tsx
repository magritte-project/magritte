import { useQueryClient } from "@tanstack/react-query"
import { useEffect, type ReactNode } from "react"

import { library } from "@/api/keys/libraries"
import { userMeNotification, userMeNotifications } from "@/api/keys/users"
import usePlayer from "@/hooks/playerHook"
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

    const player = usePlayer()
    useEffect(() => {
        if (!("mediaSession" in navigator)) {
            return
        }
        const mediaSession = navigator.mediaSession
        mediaSession.setActionHandler("play", () => player.resume())
        mediaSession.setActionHandler("pause", () => player.pause())
        mediaSession.setActionHandler("stop", () => player.stop())
        mediaSession.setActionHandler("seekbackward", () => player.skipPrevious())
        mediaSession.setActionHandler("seekforward", () => player.skipNext())
        mediaSession.setActionHandler("previoustrack", () => player.skipPrevious())
        mediaSession.setActionHandler("nexttrack", () => player.skipNext())

        const subscription = player.$events.subscribe((event) => {
            switch (event.type) {
                case "playbackStateDidChange":
                    switch (event.playbackState) {
                        case "playing":
                            mediaSession.playbackState = "playing"
                            break
                        case "paused":
                            mediaSession.playbackState = "paused"
                            break
                        case "stopped":
                            mediaSession.playbackState = "none"
                            break
                    }
                    break
                case "playingItemChanged":
                    if (player.playingItem) {
                        mediaSession.metadata = new MediaMetadata({
                            title: player.playingItem.title ?? "",
                            artist: player.playingItem.artist_name ?? "",
                            album: player.playingItem.album_title ?? "",
                            artwork: [], // TODO: artwork
                        })
                    } else {
                        mediaSession.metadata = null
                    }
                    break
                default:
                    break
            }
        })
        return () => {
            mediaSession.setActionHandler("play", null)
            mediaSession.setActionHandler("pause", null)
            mediaSession.setActionHandler("stop", null)
            mediaSession.setActionHandler("seekbackward", null)
            mediaSession.setActionHandler("seekforward", null)
            mediaSession.setActionHandler("previoustrack", null)
            mediaSession.setActionHandler("nexttrack", null)

            subscription.unsubscribe()
        }
    }, [player])

    return <>{children}</>
}
