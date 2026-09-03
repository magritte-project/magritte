import type { API } from "@magritte/api"

import type { Player } from "@/playback/player"
import { resolveResourceUrl } from "@/utilities/resources"

export function connectMediaSession(api: API, player: Player) {
    if (!("mediaSession" in navigator)) {
        return undefined
    }
    const mediaSession = navigator.mediaSession
    mediaSession.setActionHandler("play", () => player.resume())
    mediaSession.setActionHandler("pause", () => player.pause())
    mediaSession.setActionHandler("stop", () => player.stop())
    mediaSession.setActionHandler("seekbackward", () => player.skipPrevious())
    mediaSession.setActionHandler("seekforward", () => player.skipNext())
    mediaSession.setActionHandler("previoustrack", () => player.skipPrevious())
    mediaSession.setActionHandler("nexttrack", () => player.skipNext())

    const unsubscribe = player.$events((event) => {
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
                    const playingItem = player.playingItem
                    mediaSession.metadata = new MediaMetadata({
                        title: playingItem.title ?? "",
                        artist: playingItem.artist_name ?? "",
                        album: playingItem.album_title ?? "",
                        artwork: [],
                    })
                    const artworks = playingItem.artworks ?? []
                    if (artworks.length > 0) {
                        ;(async () => {
                            const token = await api.fileAccess.token()
                            if (player.playingItem?.id !== playingItem.id) {
                                console.debug("Discarding artwork for no longer playing item")
                            }
                            mediaSession.metadata = new MediaMetadata({
                                title: playingItem.title ?? "",
                                artist: playingItem.artist_name ?? "",
                                album: playingItem.album_title ?? "",
                                artwork: artworks.flatMap((artwork) => {
                                    const src = resolveResourceUrl(artwork.image_url, token)
                                    return src ? [{ src }] : []
                                }),
                            })
                        })()
                    }
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

        unsubscribe()
    }
}
