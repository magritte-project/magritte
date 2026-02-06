import {
    PauseIcon,
    PlayIcon,
    RepeatIcon,
    RepeatOnceIcon,
    ShuffleIcon,
    SkipBackIcon,
    SkipForwardIcon,
} from "@phosphor-icons/react"
import { useDebounce } from "@uidotdev/usehooks"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useMemo, useState } from "react"

import NowPlayingScrubber from "@/components/NowPlayingScrubber"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import usePlaybackModes from "@/hooks/playbackModesHook"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function TransportControls() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playbackModes = usePlaybackModes()
    const playingItem = usePlayingItem()
    const playingItemArtwork = useMemo(() => {
        return playingItem?.artworks?.[0]
    }, [playingItem])

    const handleShuffleClick = useCallback(async () => {
        await player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle())
    }, [player])
    const handleRepeatClick = useCallback(async () => {
        await player.setPlaybackModes((playbackModes) => playbackModes.withNextRepeat())
    }, [player])

    const [isExpanded, setIsExpanded] = useState(false)
    const handleMouseEnter = useCallback(() => {
        setIsExpanded(true)
    }, [])
    const handleMouseLeave = useCallback(() => {
        setIsExpanded(false)
    }, [])
    const debouncedIsExpanded = useDebounce(isExpanded, 200)

    return (
        <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative isolate">
                <div className="absolute inset-0 backdrop-blur-lg mask-[radial-gradient(50%_100%_at_bottom_center,black,black,transparent)] -z-10" />
                <div className="p-4 flex flex-col items-center gap-2">
                    {debouncedIsExpanded && (
                        <motion.div
                            key="artwork"
                            initial={{ opacity: 0, scale: 0.9, y: 9 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 9 }}
                        >
                            <ArtworkImage
                                className="w-3xs aspect-square"
                                artworks={playingItem?.artworks}
                                itemTitle={playingItem?.title}
                            />
                        </motion.div>
                    )}
                    <AnimatePresence initial={false}>
                        <motion.div
                            layout
                            key="playingItem"
                            className="flex flex-col items-center gap-0.5 text-shadow-lg text-shadow-white"
                        >
                            <motion.div key="title" layout className="font-medium">
                                {playingItem ? (playingItem.title ?? "--") : "Nothing Playing"}
                            </motion.div>
                            {debouncedIsExpanded && (
                                <>
                                    <div className="text-sm">
                                        {playingItem?.album_title ?? "--"}{" "}
                                        <span className="text-gray-500">by</span>{" "}
                                        {playingItem?.artist_name ?? "--"}
                                    </div>
                                    <NowPlayingScrubber />
                                </>
                            )}
                        </motion.div>
                        <motion.div
                            key="controls"
                            layout
                            className="text-2xl flex items-center gap-2"
                        >
                            <AsyncButton
                                buttonComponent={ThemedSubtleButton}
                                className={classNames({
                                    "text-blue-500": playbackModes.shuffle === "on",
                                    "text-gray-500": playbackModes.shuffle === "off",
                                })}
                                onClick={handleShuffleClick}
                            >
                                <ShuffleIcon
                                    weight={playbackModes.shuffle === "on" ? "bold" : "regular"}
                                    aria-label={
                                        playbackModes.shuffle === "on"
                                            ? "Shuffle on"
                                            : "Shuffle off"
                                    }
                                />
                            </AsyncButton>
                            <AsyncButton
                                className={classNames(
                                    "p-2 rounded-full active:bg-black/10",
                                    "font-bold text-gray-800 disabled:text-gray-300",
                                )}
                                style={
                                    playingItemArtwork
                                        ? {
                                              color: `${playingItemArtwork.secondary_color}`,
                                          }
                                        : {}
                                }
                                onClick={() => player.skipPrevious()}
                            >
                                <SkipBackIcon weight="fill" aria-label="Play" />
                            </AsyncButton>
                            <AsyncButton
                                className={classNames(
                                    "bg-blue-500 text-slate-50 active:text-white font-bold",
                                    "p-4 rounded-full drop-shadow-sm",
                                )}
                                style={
                                    playingItemArtwork
                                        ? {
                                              backgroundColor: `${playingItemArtwork.background_color}`,
                                              color: `${playingItemArtwork.primary_color}`,
                                          }
                                        : {}
                                }
                                onClick={() =>
                                    player.playbackState === "playing"
                                        ? player.pause()
                                        : player.resume()
                                }
                            >
                                {playbackState === "playing" ? (
                                    <PauseIcon weight="fill" aria-label="Pause" />
                                ) : (
                                    <PlayIcon weight="fill" aria-label="Next" />
                                )}
                            </AsyncButton>
                            <AsyncButton
                                className={classNames(
                                    "p-2 rounded-full active:bg-black/10",
                                    "font-bold text-gray-800 disabled:text-gray-300",
                                )}
                                style={
                                    playingItemArtwork
                                        ? {
                                              color: `${playingItemArtwork.secondary_color}`,
                                          }
                                        : {}
                                }
                                onClick={() => player.skipNext()}
                            >
                                <SkipForwardIcon weight="fill" aria-label="Play" />
                            </AsyncButton>
                            <AsyncButton
                                buttonComponent={ThemedSubtleButton}
                                className={classNames({
                                    "text-blue-500": playbackModes.repeat !== "off",
                                    "text-gray-500": playbackModes.repeat === "off",
                                })}
                                onClick={handleRepeatClick}
                            >
                                {playbackModes.repeat === "one" ? (
                                    <RepeatOnceIcon weight="bold" aria-label="Repeat one" />
                                ) : (
                                    <RepeatIcon
                                        weight={playbackModes.repeat !== "off" ? "bold" : "regular"}
                                        aria-label={
                                            playbackModes.repeat === "all"
                                                ? "Repeat all"
                                                : "Repeat off"
                                        }
                                    />
                                )}
                            </AsyncButton>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
