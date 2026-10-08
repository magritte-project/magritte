import { PlayIcon } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"

import useIsRouteVisible from "@/hooks/routeVisibleHook"
import { getVideoUrl, type YouTubeVideo } from "@/youtube/types"

const EMBED_ORIGIN = "https://www.youtube-nocookie.com"

/** How often to ask the embedded player to report its state, until it answers */
const LISTEN_INTERVAL_MS = 250

/** The `playerState` the embedded player reports while a video is playing */
const PLAYER_STATE_PLAYING = 1

export interface VideoPlayerProps {
    readonly video: YouTubeVideo
    /** Called each time the video starts playing */
    readonly onPlay?: () => void
}

function getEmbedUrl(video: YouTubeVideo): string {
    const parameters = new URLSearchParams({
        // Has the player report its state, which is how `onPlay` gets called
        enablejsapi: "1",
        origin: window.location.origin,
        playsinline: "1",
        rel: "0",
    })
    return `${EMBED_ORIGIN}/embed/${encodeURIComponent(video.id)}?${parameters}`
}

/**
 * Plays a video in place, or links to it on youtube.com when its uploader does
 * not allow it to be played anywhere else.
 */
export default function VideoPlayer({ video, onPlay }: VideoPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const isVisible = useIsRouteVisible()
    const onPlayRef = useRef(onPlay)
    useEffect(() => {
        onPlayRef.current = onPlay
    }, [onPlay])

    useEffect(() => {
        const iframe = iframeRef.current
        if (iframe === null) {
            return
        }
        // This is the handshake YouTube's own IFrame API script performs: the
        // player stays quiet until it has been told somebody is listening, and
        // it may not be ready to hear that when the frame's `load` event fires
        const listen = () => {
            iframe.contentWindow?.postMessage(
                JSON.stringify({ event: "listening", id: video.id, channel: "widget" }),
                EMBED_ORIGIN,
            )
        }
        let interval: ReturnType<typeof setInterval> | undefined
        const startListening = () => {
            clearInterval(interval)
            interval = setInterval(listen, LISTEN_INTERVAL_MS)
        }
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) {
                return
            }
            clearInterval(interval)
            if (typeof event.data !== "string") {
                return
            }
            let message: any
            try {
                message = JSON.parse(event.data)
            } catch {
                return
            }
            if (
                message?.event === "infoDelivery" &&
                message.info?.playerState === PLAYER_STATE_PLAYING
            ) {
                onPlayRef.current?.()
            }
        }
        iframe.addEventListener("load", startListening)
        window.addEventListener("message", handleMessage)
        return () => {
            clearInterval(interval)
            iframe.removeEventListener("load", startListening)
            window.removeEventListener("message", handleMessage)
        }
    }, [video.id, isVisible])

    if (!video.embeddable) {
        return (
            <a
                className="group relative block aspect-video w-full overflow-clip bg-black"
                href={getVideoUrl(video)}
                target="_blank"
                rel="noreferrer noopener"
            >
                {video.thumbnailUrl && (
                    <img
                        className="h-full w-full object-cover opacity-70 group-hover:opacity-90"
                        src={video.thumbnailUrl}
                        alt=""
                    />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm font-semibold text-white">
                    <PlayIcon size="2em" weight="fill" aria-hidden />
                    Watch on YouTube
                </div>
            </a>
        )
    }
    if (!isVisible) {
        // A hidden frame would keep playing with no way to stop it, so the player is
        // taken down while another page is on top and starts over on coming back
        return <div className="aspect-video w-full bg-black" />
    }
    return (
        <iframe
            // Keyed so the player starts over, rather than navigating, when the video changes
            key={video.id}
            ref={iframeRef}
            className="block aspect-video w-full bg-black"
            src={getEmbedUrl(video)}
            title={video.title}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
        />
    )
}
