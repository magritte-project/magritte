import { PauseIcon, PlayIcon } from "@phosphor-icons/react"
import classNames from "classnames"

import { themedCheckboxBoxClassName } from "@/components/theme/ThemedCheckbox"
import usePlaybackState from "@/hooks/playbackStateHook"
import usePlayer from "@/hooks/playerHook"

const BAR_DELAYS = ["0s", "-0.3s", "-0.6s"] as const

export interface LibrarySongPlaybackControlProps {
    readonly className?: string
}

/**
 * Sits in place of a song row's checkbox while that song is the playing item. At rest it shows
 * animated now-playing bars; when the row is hovered (or the control focused) it becomes a
 * pause/play button. Expects an ancestor with the `group` class (the table row).
 */
export default function LibrarySongPlaybackControl({ className }: LibrarySongPlaybackControlProps) {
    const player = usePlayer()
    const playbackState = usePlaybackState()
    const isPlaying = playbackState === "playing"

    return (
        <button
            type="button"
            className={classNames(themedCheckboxBoxClassName, "cursor-pointer text-key", className)}
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={(e) => {
                e.stopPropagation()
                if (player.playbackState === "playing") {
                    player.pause()
                } else {
                    player.resume()
                }
            }}
        >
            <span
                className={classNames(
                    "w-[0.8em] h-[0.8em] flex items-end justify-between",
                    "group-hover:hidden group-focus-within:hidden",
                    { "opacity-60": !isPlaying },
                )}
                aria-hidden
            >
                {BAR_DELAYS.map((delay) => (
                    <span
                        key={delay}
                        className={classNames(
                            "w-[2px] rounded-sm bg-current animate-now-playing motion-reduce:animate-none",
                            { "[animation-play-state:paused]": !isPlaying },
                        )}
                        style={{ animationDelay: delay }}
                    />
                ))}
            </span>
            {isPlaying ? (
                <PauseIcon
                    className="hidden group-hover:block group-focus-within:block"
                    weight="fill"
                    size="0.8em"
                    aria-hidden
                />
            ) : (
                <PlayIcon
                    className="hidden group-hover:block group-focus-within:block"
                    weight="fill"
                    size="0.8em"
                    aria-hidden
                />
            )}
        </button>
    )
}
