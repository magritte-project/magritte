import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import { useDocumentTitle, useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useRef, useState } from "react"

import PlayerScrubber from "@/components/player/PlayerScrubber"
import PlayerVolume from "@/components/player/PlayerVolume"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import useHotKey from "@/hooks/hotKeyHook"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function PlayerFooter() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playingItem = usePlayingItem()

    const isPrimarilyTouch = useMediaQuery("(pointer: coarse)")
    const repressExpansion = useRef(false)
    const changeIsExpandedTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const handleMouseEnter = useCallback(() => {
        if (!repressExpansion.current) {
            if (changeIsExpandedTimerId.current) {
                clearTimeout(changeIsExpandedTimerId.current)
            }
            changeIsExpandedTimerId.current = setTimeout(() => {
                setIsExpanded(true)
            }, 500)
        }
    }, [])
    const handleMouseLeave = useCallback(() => {
        if (changeIsExpandedTimerId.current) {
            clearTimeout(changeIsExpandedTimerId.current)
        }
        changeIsExpandedTimerId.current = setTimeout(() => {
            setIsExpanded(false)
        }, 500)
    }, [])

    useDocumentTitle(
        playingItem
            ? `Magritte: ${playingItem.title} by ${playingItem.artist_name ?? "--"}`
            : "Magritte",
    )

    useHotKey({ key: "ArrowLeft" }, () => {
        player.skipPrevious()
        return true
    })
    useHotKey({ key: "ArrowRight" }, () => {
        player.skipNext()
        return true
    })
    useHotKey({ key: "ArrowUp" }, () => {
        player.volume += 0.05
        return true
    })
    useHotKey({ key: "ArrowDown" }, () => {
        player.volume -= 0.05
        return true
    })

    return (
        <div
            className="fixed bottom-0 inset-x-0"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative isolate bg-linear-to-t from-primary/50 to-transparent">
                <div className="absolute inset-x-0 -top-full bottom-0 backdrop-blur-lg mask-[linear-gradient(to_top,black,transparent)] pointer-events-none -z-10" />
                <div className="p-outside flex items-center gap-6 max-w-2xl mx-auto">
                    <ArtworkImage
                        className="aspect-square w-20 shadow-lg shadow-high-contrast"
                        artworks={playingItem?.artworks}
                        itemTitle={playingItem?.title}
                    />
                    <motion.div
                        layout
                        className="min-w-0 flex-1 flex flex-col gap-0.5 text-shadow-lg text-shadow-high-contrast"
                    >
                        <AnimatePresence initial={false}>
                            <motion.div
                                key="nowPlayingTitle"
                                layout
                                className="font-medium"
                                title={playingItem?.title ?? "Nothing Playing"}
                            >
                                {playingItem ? (playingItem.title ?? "--") : "Nothing Playing"}
                            </motion.div>
                            <motion.div
                                key="nowPlayingDetails"
                                layout
                                className="text-sm truncate"
                                title={`${playingItem?.album_title ?? "--"} by ${playingItem?.artist_name ?? "--"}`}
                            >
                                {playingItem?.album_title ?? "--"}{" "}
                                <span className="text-on-secondary">by</span>{" "}
                                {playingItem?.artist_name ?? "--"}
                            </motion.div>
                            {(isExpanded || isPrimarilyTouch) && (
                                <motion.div
                                    key="nowPlayingScrubber"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    <PlayerScrubber />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    <motion.div layout className="flex flex-col">
                        <AnimatePresence initial={false}>
                            <motion.div
                                layout
                                className="flex items-center gap-between drop-shadow-lg drop-shadow-high-contrast"
                            >
                                <AsyncButton
                                    className={classNames(
                                        "p-2 rounded-full active:bg-on-primary/10",
                                        "font-bold text-on-primary disabled:opacity-disabled",
                                    )}
                                    title="Skip Previous"
                                    onClick={() => player.skipPrevious()}
                                >
                                    <SkipBackIcon size="1.4rem" weight="fill" />
                                </AsyncButton>
                                <AsyncButton
                                    className={classNames(
                                        "p-2 rounded-full active:bg-on-primary/10",
                                        "font-bold text-on-primary disabled:opacity-disabled",
                                    )}
                                    title={playbackState === "playing" ? "Pause" : "Play"}
                                    onClick={() =>
                                        player.playbackState === "playing"
                                            ? player.pause()
                                            : player.resume()
                                    }
                                >
                                    {playbackState === "playing" ? (
                                        <PauseIcon size="1.4rem" weight="fill" />
                                    ) : (
                                        <PlayIcon size="1.4rem" weight="fill" />
                                    )}
                                </AsyncButton>
                                <AsyncButton
                                    className={classNames(
                                        "p-2 rounded-full active:bg-on-primary/10",
                                        "font-bold text-on-primary disabled:opacity-disabled",
                                    )}
                                    title="Skip Next"
                                    onClick={() => player.skipNext()}
                                >
                                    <SkipForwardIcon size="1.4rem" weight="fill" />
                                </AsyncButton>
                            </motion.div>
                            {(isExpanded || isPrimarilyTouch) && (
                                <motion.div
                                    key="nowPlayingVolume"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="pt-2.25"
                                >
                                    <PlayerVolume />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
