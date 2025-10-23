import ArtworkImage from "@/components/ArtworkImage"
import ThemedButton from "@/components/theme/ThemedButton"
import usePlayer from "@/hooks/playerHook"
import usePlayerState from "@/hooks/playerStateHook"
import {
    PauseIcon,
    PlayIcon,
    SkipBackIcon,
    SkipForwardIcon,
} from "@phosphor-icons/react"

export default function NowPlaying() {
    const player = usePlayer()
    const { playbackState, playingSong } = usePlayerState()
    return (
        <div className="p-4">
            <div className="flex flex-col gap-3">
                <ArtworkImage
                    className="w-full aspect-square"
                    artworks={playingSong?.artworks}
                    itemTitle={playingSong?.title}
                />
                <div className="flex flex-col items-center gap-1 text-sm text-center">
                    <div className="font-bold">
                        {playingSong?.title ?? "--"}
                    </div>
                    <div className="text-gray-700">
                        {playingSong?.album_title ?? "--"} by{" "}
                        {playingSong?.artist_name ?? "--"}
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <ThemedButton onClick={() => player.skipPrevious()}>
                        <SkipBackIcon />
                    </ThemedButton>
                    <ThemedButton
                        onClick={() =>
                            player.playbackState === "playing"
                                ? player.pause()
                                : player.resume()
                        }
                    >
                        {playbackState === "playing" ? (
                            <PauseIcon />
                        ) : (
                            <PlayIcon />
                        )}
                    </ThemedButton>
                    <ThemedButton onClick={() => player.skipNext()}>
                        <SkipForwardIcon />
                    </ThemedButton>
                </div>
                <header className="font-bold text-2xl border-t border-gray-200 pt-3">
                    Up Next
                </header>
            </div>
        </div>
    )
}
