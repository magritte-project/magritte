import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import { RepeatIcon, RepeatOnceIcon, ShuffleIcon } from "@phosphor-icons/react/dist/ssr"
import classNames from "classnames"
import { useCallback } from "react"

import NowPlayingScrubber from "@/components/NowPlayingScrubber"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import usePlaybackModes from "@/hooks/playbackModesHook"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function NowPlaying() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playbackModes = usePlaybackModes()
    const playingItem = usePlayingItem()
    const handleShuffleClick = useCallback(async () => {
        await player.setPlaybackModes((playbackModes) => playbackModes.withNextShuffle())
    }, [player])
    const handleRepeatClick = useCallback(async () => {
        await player.setPlaybackModes((playbackModes) => playbackModes.withNextRepeat())
    }, [player])
    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-3 p-4">
                <ArtworkImage
                    className="w-full aspect-square"
                    artworks={playingItem?.artworks}
                    itemTitle={playingItem?.title}
                />
                <div className="flex flex-col items-center gap-1 text-sm text-center">
                    <div className="font-bold">{playingItem?.title ?? "--"}</div>
                    <div className="text-gray-700">
                        {playingItem?.album_title ?? "--"} by {playingItem?.artist_name ?? "--"}
                    </div>
                </div>
                <NowPlayingScrubber />
                <div className="flex items-center justify-center gap-3">
                    <ThemedButton onClick={() => player.skipPrevious()}>
                        <SkipBackIcon weight="fill" />
                    </ThemedButton>
                    <ThemedButton
                        onClick={() =>
                            player.playbackState === "playing" ? player.pause() : player.resume()
                        }
                    >
                        {playbackState === "playing" ? (
                            <PauseIcon weight="fill" />
                        ) : (
                            <PlayIcon weight="fill" />
                        )}
                    </ThemedButton>
                    <ThemedButton onClick={() => player.skipNext()}>
                        <SkipForwardIcon weight="fill" />
                    </ThemedButton>
                </div>
                <div className="flex items-center justify-around gap-3 text-lg">
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
                                playbackModes.shuffle === "on" ? "Shuffle on" : "Shuffle off"
                            }
                        />
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
                                    playbackModes.repeat === "all" ? "Repeat all" : "Repeat off"
                                }
                            />
                        )}
                    </AsyncButton>
                </div>
            </div>
        </div>
    )
}
