import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function PlayerOverlay() {
    const playbackState = usePlaybackState()
    const [hasFocus, setHasFocus] = useState(() => document.hasFocus())
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null
        const onFocus = () => {
            if (timer !== null) {
                clearTimeout(timer)
                timer = null
            }
            setHasFocus(true)
        }
        document.addEventListener("focus", onFocus)

        const onBlur = () => {
            timer = setTimeout(() => setHasFocus(false), 1_000)
        }
        document.addEventListener("blur", onBlur)

        return () => {
            if (timer !== null) {
                clearTimeout(timer)
                timer = null
            }
            document.removeEventListener("focus", onFocus)
            document.removeEventListener("blur", onBlur)
        }
    }, [])
    return (
        <AnimatePresence mode="wait">
            {!hasFocus && playbackState !== "stopped" && (
                <motion.div
                    key="playerOverlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 overlay-material-hard z-100 flex items-center justify-center p-lg"
                >
                    <PlayerOverlayContent />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function PlayerOverlayContent() {
    const playingItem = usePlayingItem()

    return (
        <div className="flex flex-col items-center gap-lg text-center">
            <ArtworkImage
                className="aspect-square w-[33vw] shadow-lg shadow-high-contrast"
                artworks={playingItem?.artworks}
                itemTitle={playingItem?.title}
            />
            <div className="font-medium" title={playingItem?.title ?? "Nothing Playing"}>
                {playingItem ? (playingItem.title ?? "--") : "Nothing Playing"}
            </div>
            <div
                className="text-sm truncate"
                title={`${playingItem?.album_title ?? "--"} by ${playingItem?.artist_name ?? "--"}`}
            >
                {playingItem?.album_title ?? "--"} <span className="text-on-secondary">by</span>{" "}
                {playingItem?.artist_name ?? "--"}
            </div>
        </div>
    )
}
