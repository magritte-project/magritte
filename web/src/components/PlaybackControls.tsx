import ArtworkImage from "@/components/ArtworkImage"
import ThemedButton from "@/components/theme/ThemedButton"
import usePlayer from "@/hooks/playerHook"
import usePlayerState from "@/hooks/playerStateHook"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import {
    PauseIcon,
    PlayIcon,
    SkipBackIcon,
    SkipForwardIcon,
    WaveformIcon,
} from "@phosphor-icons/react"

export default function PlaybackControls() {
    const player = usePlayer()
    const { playbackState, playingSong } = usePlayerState()
    return (
        <Popover className="relative">
            <PopoverButton className="px-3 py-2 font-bold rounded-full bg-gray-50 data-open:bg-gray-100">
                <WaveformIcon weight="bold" />
            </PopoverButton>
            <PopoverPanel
                anchor="bottom end"
                className="bg-white border border-slate-100 shadow rounded-sm p-2 flex flex-col gap-2"
            >
                <header className="flex items-center gap-2">
                    <ArtworkImage
                        className="h-16 w-16"
                        artworks={playingSong?.artworks}
                        itemTitle={playingSong?.title}
                    />
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="font-bold">
                            {playingSong?.title ?? "--"}
                        </div>
                        <div className="text-gray-700">
                            {playingSong?.album_title ?? "--"} by{" "}
                            {playingSong?.artist_name ?? "--"}
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center gap-2">
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
            </PopoverPanel>
        </Popover>
    )
}
