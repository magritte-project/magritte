import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import { useDebounce } from "@uidotdev/usehooks"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useMemo, useRef, useState } from "react"

import NowPlayingScrubber from "@/components/NowPlayingScrubber"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

type GestureState =
    | {
          isTracking: false
          initialScreenX: null
          initialScreenY: null
      }
    | {
          isTracking: true
          initialScreenX: number
          initialScreenY: number
      }

function parseTranslate(translate: string) {
    if (translate === "none") {
        return { translateX: 0, translateY: 0 }
    }
    const [translateX, translateY] = translate
        .split(" ")
        .map((value) => parseInt(value.replace("px", "")))
    return { translateX, translateY }
}

export default function TransportControls() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playingItem = usePlayingItem()
    const playingItemArtwork = useMemo(() => {
        return playingItem?.artworks?.[0]
    }, [playingItem])

    const gestureStateRef = useRef<GestureState>({
        isTracking: false,
        initialScreenX: null,
        initialScreenY: null,
    })
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        gestureStateRef.current = {
            isTracking: true,
            initialScreenX: e.screenX,
            initialScreenY: e.screenY,
        }
        const buttonElement = e.currentTarget
        buttonElement.style.translate = "none"
    }, [])
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (!gestureStateRef.current.isTracking) {
            return
        }
        const buttonElement = e.currentTarget
        const deltaX = e.screenX - gestureStateRef.current.initialScreenX
        const deltaY = e.screenY - gestureStateRef.current.initialScreenY
        const translateX = Math.max(-50, Math.min(deltaX, 50))
        buttonElement.style.translate = `${translateX}px 0px`
    }, [])
    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            const buttonElement = e.currentTarget
            gestureStateRef.current = {
                isTracking: false,
                initialScreenX: null,
                initialScreenY: null,
            }

            const { translateX } = parseTranslate(buttonElement.style.translate)
            if (translateX > 0) {
                e.stopPropagation()
                e.preventDefault()
                player.skipNext()
            } else if (translateX < 0) {
                e.stopPropagation()
                e.preventDefault()
                player.skipPrevious()
            }
            buttonElement.style.translate = "none"
        },
        [player],
    )

    const [isExpanded, setIsExpanded] = useState(false)
    const handleMouseEnter = useCallback(() => {
        // setIsExpanded(true)
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
                                className={classNames(
                                    "p-2 rounded-full active:bg-black/10",
                                    "font-bold text-gray-800 disabled:text-gray-300",
                                    { hidden: !debouncedIsExpanded },
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
                                className="relative drop-shadow-sm"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onClick={async (e) => {
                                    const { translateX } = parseTranslate(
                                        e.currentTarget.style.translate,
                                    )
                                    console.log(translateX)
                                    if (translateX !== 0) {
                                        return
                                    }
                                    if (player.playbackState === "playing") {
                                        await player.pause()
                                    } else {
                                        await player.resume()
                                    }
                                }}
                            >
                                <ArtworkImage
                                    variant="plain"
                                    className={classNames("aspect-square bg-blue-500", {
                                        "w-3xs": debouncedIsExpanded,
                                        "w-16": !debouncedIsExpanded,
                                        "rounded-md": debouncedIsExpanded,
                                        "rounded-full": !debouncedIsExpanded,
                                    })}
                                    artworks={playingItem?.artworks}
                                    itemTitle={playingItem?.title}
                                />
                                <span className="absolute top-1/2 left-1/2 -translate-1/2 text-white/95 bg-blend-hard-light">
                                    {playbackState === "playing" ? (
                                        <PauseIcon weight="fill" aria-label="Pause" />
                                    ) : (
                                        <PlayIcon weight="fill" aria-label="Next" />
                                    )}
                                </span>
                            </AsyncButton>
                            <AsyncButton
                                className={classNames(
                                    "p-2 rounded-full active:bg-black/10",
                                    "font-bold text-gray-800 disabled:text-gray-300",
                                    { hidden: !debouncedIsExpanded },
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
