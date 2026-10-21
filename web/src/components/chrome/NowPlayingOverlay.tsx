import { XIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"

import PlayerScrubber from "@/components/player/PlayerScrubber"
import PlayerTransportControls from "@/components/player/PlayerTransportControls"
import PlayerVolume from "@/components/player/PlayerVolume"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import usePlayingItem from "@/hooks/playingItemHook"

export interface NowPlayingOverlayProps {
    readonly isVisible: boolean
    readonly setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export default function NowPlayingOverlay({ isVisible, setIsVisible }: NowPlayingOverlayProps) {
    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    className="fixed inset-0 overlay-material-hard z-1000 flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <ThemedHeader
                        className="w-full"
                        supplementaryStart={
                            <ThemedSubtleButton
                                type="button"
                                onClick={() => setIsVisible(false)}
                                title="Close"
                            >
                                <XIcon />
                            </ThemedSubtleButton>
                        }
                    >
                        Now Playing
                    </ThemedHeader>
                    <NowPlayingContent />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function NowPlayingContent() {
    const playingItem = usePlayingItem()

    return (
        <div className="flex-1 min-w-10 w-120 max-w-full flex flex-col items-center justify-center gap-lg p-xl">
            <ArtworkImage
                className="aspect-square w-full mb-lg shadow-lg shadow-high-contrast"
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
            <div className="w-full px-lg">
                <PlayerScrubber />
            </div>
            <div className="flex items-center gap-lg">
                <PlayerTransportControls />
            </div>
            <div className="w-full px-lg">
                <PlayerVolume />
            </div>
        </div>
    )
}
