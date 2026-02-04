import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"

import NowPlayingScrubber from "@/components/NowPlayingScrubber"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ThemedButton from "@/components/theme/ThemedButton"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"

export default function NowPlaying() {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const playingItem = usePlayingItem()
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
            </div>
        </div>
    )
}
