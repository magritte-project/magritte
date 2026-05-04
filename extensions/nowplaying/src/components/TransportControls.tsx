import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import classNames from "classnames"

import useNowPlaying from "@/hooks/nowPlayingHook"
import useTransportControls from "@/hooks/transportControlsHook"

export default function TransportControls() {
    const { state } = useNowPlaying()
    const { resume, pause, skipPrevious, skipNext } = useTransportControls()
    return (
        <div className="flex items-center justify-evenly gap-2">
            <button
                className={classNames(
                    "p-2 rounded-full active:bg-black/10",
                    "font-bold text-gray-800 disabled:text-gray-300",
                )}
                onClick={() => skipPrevious()}
            >
                <SkipBackIcon weight="fill" aria-label="Skip Previous" />
            </button>

            <button
                className={classNames(
                    "p-2 rounded-full active:bg-black/10",
                    "font-bold text-gray-800 disabled:text-gray-300",
                )}
                onClick={() => (state === "playing" ? pause() : resume())}
            >
                {state === "playing" ? (
                    <PauseIcon weight="fill" aria-label="Pause" />
                ) : (
                    <PlayIcon weight="fill" aria-label="Next" />
                )}
            </button>

            <button
                className={classNames(
                    "p-2 rounded-full active:bg-black/10",
                    "font-bold text-gray-800 disabled:text-gray-300",
                )}
                onClick={() => skipNext()}
            >
                <SkipForwardIcon weight="fill" aria-label="Skip Next" />
            </button>
        </div>
    )
}
