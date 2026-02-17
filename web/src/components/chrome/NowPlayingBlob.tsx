import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import NowPlayingScrubber from "@/components/NowPlayingScrubber"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import DPad from "@/components/reusable/DPad"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function TransportControls() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playingItem = usePlayingItem()
    const { setIsOpen: setCommandPaletteIsOpen } = useAppCommandPaletteContext()

    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2">
            <div className="relative isolate">
                <div className="absolute inset-0 backdrop-blur-lg mask-[radial-gradient(50%_100%_at_bottom_center,black,black,transparent)] -z-10" />
                <div className="p-4 flex flex-col items-center gap-2">
                    <AnimatePresence initial={false}>
                        <motion.div
                            layout
                            key="playingItem"
                            className="flex flex-col items-center gap-0.5 text-shadow-lg text-shadow-white"
                        >
                            <motion.div key="title" layout className="font-medium">
                                {playingItem ? (playingItem.title ?? "--") : "Nothing Playing"}
                            </motion.div>
                            {isExpanded && (
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
                            {isExpanded && (
                                <AsyncButton
                                    className={classNames(
                                        "p-2 rounded-full active:bg-black/10",
                                        "font-bold text-gray-800 disabled:text-gray-300",
                                    )}
                                    onClick={() => player.skipPrevious()}
                                >
                                    <SkipBackIcon weight="fill" aria-label="Play" />
                                </AsyncButton>
                            )}
                            <DPad
                                onDraggedPastTop={() => setIsExpanded((oldValue) => !oldValue)}
                                onDraggedPastStart={() => player.skipPrevious()}
                                onDraggedPastEnd={() => player.skipNext()}
                                onDraggedPastBottom={() => setCommandPaletteIsOpen(true)}
                            >
                                <AsyncButton
                                    className={classNames(
                                        "bg-blue-500 text-slate-50 active:text-white font-bold",
                                        "relative rounded-md drop-shadow-sm",
                                    )}
                                    onClick={() =>
                                        player.playbackState === "playing"
                                            ? player.pause()
                                            : player.resume()
                                    }
                                >
                                    <ArtworkImage
                                        className={classNames("aspect-square", {
                                            "w-3xs": isExpanded,
                                            "w-16": !isExpanded,
                                        })}
                                        artworks={playingItem?.artworks}
                                        itemTitle={playingItem?.title}
                                    />
                                    <div className="absolute top-1/2 left-1/2 -translate-1/2 p-4 text-white/90 mix-blend-plus-lighter">
                                        {playbackState === "playing" ? (
                                            <PauseIcon weight="fill" aria-label="Pause" />
                                        ) : (
                                            <PlayIcon weight="fill" aria-label="Next" />
                                        )}
                                    </div>
                                </AsyncButton>
                            </DPad>
                            {isExpanded && (
                                <AsyncButton
                                    className={classNames(
                                        "p-2 rounded-full active:bg-black/10",
                                        "font-bold text-gray-800 disabled:text-gray-300",
                                    )}
                                    onClick={() => player.skipNext()}
                                >
                                    <SkipForwardIcon weight="fill" aria-label="Play" />
                                </AsyncButton>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
