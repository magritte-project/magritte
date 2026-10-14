import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import { useDocumentTitle, useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useRef, useState } from "react"

import LibraryTabs from "@/components/chrome/LibraryTabs"
import PlayerScrubber from "@/components/player/PlayerScrubber"
import PlayerVolume from "@/components/player/PlayerVolume"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import useHotKey from "@/hooks/hotKeyHook"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"
import { toggle } from "@/utilities/react"

export default function PageFooter() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playingItem = usePlayingItem()

    const isSm = useMediaQuery("(max-width: 768px)")
    const [isNowPlayingRevealed, setIsNowPlayingRevealed] = useState(false)

    const isPrimarilyTouch = useMediaQuery("(pointer: coarse)")
    const changeIsMouseOverTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [isMouseOver, setIsMouseOver] = useState(false)
    const handleMouseEnter = useCallback(() => {
        if (changeIsMouseOverTimerId.current) {
            clearTimeout(changeIsMouseOverTimerId.current)
        }
        changeIsMouseOverTimerId.current = setTimeout(() => {
            setIsMouseOver(true)
        }, 500)
    }, [])
    const handleMouseLeave = useCallback(() => {
        if (changeIsMouseOverTimerId.current) {
            clearTimeout(changeIsMouseOverTimerId.current)
        }
        changeIsMouseOverTimerId.current = setTimeout(() => {
            setIsMouseOver(false)
        }, 500)
    }, [])

    useDocumentTitle(
        playingItem
            ? `Magritte: ${playingItem.title} by ${playingItem.artist_name ?? "--"}`
            : "Magritte",
    )

    useHotKey({ key: "ArrowLeft" }, () => {
        void player.skipPrevious()
        return true
    })
    useHotKey({ key: "ArrowRight" }, () => {
        void player.skipNext()
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
            className="fixed bottom-0 inset-x-0 h-footer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative isolate bg-linear-to-t from-primary/50 to-transparent">
                <div className="absolute inset-x-0 -top-full bottom-0 backdrop-blur-lg mask-[linear-gradient(to_top,black,transparent)] pointer-events-none -z-10" />
                <div className="relative p-lg flex items-center gap-6 max-w-2xl mx-auto">
                    <AnimatePresence initial={false} mode="popLayout">
                        {isSm && !isNowPlayingRevealed && (
                            <motion.div
                                key="libraryTabs"
                                className="flex-1"
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <LibraryTabs />
                            </motion.div>
                        )}
                        <motion.div key="nowPlayingArtwork" layout>
                            <ArtworkImage
                                className="aspect-square w-20 shadow-lg shadow-high-contrast"
                                artworks={playingItem?.artworks}
                                itemTitle={playingItem?.title}
                                onClick={() => setIsNowPlayingRevealed(toggle)}
                            />
                        </motion.div>
                        {(!isSm || isNowPlayingRevealed) && (
                            <motion.div
                                key="nowPlaying"
                                layout
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                className="min-w-0 flex-1 flex flex-col gap-xs text-shadow-lg text-shadow-high-contrast"
                            >
                                <AnimatePresence initial={false}>
                                    <motion.div
                                        key="nowPlayingTitle"
                                        layout
                                        className="font-medium"
                                        title={playingItem?.title ?? "Nothing Playing"}
                                    >
                                        {playingItem
                                            ? (playingItem.title ?? "--")
                                            : "Nothing Playing"}
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
                                    {(isMouseOver || isPrimarilyTouch) && (
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
                        )}
                        {(!isSm || isNowPlayingRevealed) && (
                            <motion.div
                                key="transportControls"
                                layout
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                className="flex flex-col"
                            >
                                <AnimatePresence initial={false}>
                                    <motion.div
                                        layout
                                        className="flex items-center gap-lg drop-shadow-lg drop-shadow-high-contrast"
                                    >
                                        <AsyncButton
                                            className={classNames(
                                                " p-md rounded-button active:bg-on-primary/10",
                                                "font-bold text-on-primary disabled:opacity-disabled",
                                            )}
                                            title="Skip Previous"
                                            onClick={() => player.skipPrevious()}
                                        >
                                            <SkipBackIcon size="1.4rem" weight="fill" />
                                        </AsyncButton>
                                        <AsyncButton
                                            className={classNames(
                                                " p-md rounded-button active:bg-on-primary/10",
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
                                                " p-md rounded-button active:bg-on-primary/10",
                                                "font-bold text-on-primary disabled:opacity-disabled",
                                            )}
                                            title="Skip Next"
                                            onClick={() => player.skipNext()}
                                        >
                                            <SkipForwardIcon size="1.4rem" weight="fill" />
                                        </AsyncButton>
                                    </motion.div>
                                    {(isMouseOver || isPrimarilyTouch) && (
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
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
