import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react"
import classNames from "classnames"

import AsyncButton from "@/components/reusable/AsyncButton"
import usePlaybackState from "@/hooks/playbackStateHook"

export interface PlayerTransportControlsProps {
    readonly iconSize?: string
}

export default function PlayerTransportControls({
    iconSize = "1.4rem",
}: PlayerTransportControlsProps) {
    const { playbackState, pauseResume, skipPrevious, skipNext } = usePlaybackState()

    return (
        <>
            <AsyncButton
                className={classNames(
                    " p-md rounded-button active:bg-on-primary/10",
                    "font-bold text-on-primary disabled:opacity-disabled",
                )}
                title="Skip Previous"
                onClick={skipPrevious}
            >
                <SkipBackIcon size={iconSize} weight="fill" />
            </AsyncButton>
            <AsyncButton
                className={classNames(
                    " p-md rounded-button active:bg-on-primary/10",
                    "font-bold text-on-primary disabled:opacity-disabled",
                )}
                title={playbackState === "playing" ? "Pause" : "Play"}
                onClick={pauseResume}
            >
                {playbackState === "playing" ? (
                    <PauseIcon size={iconSize} weight="fill" />
                ) : (
                    <PlayIcon size={iconSize} weight="fill" />
                )}
            </AsyncButton>
            <AsyncButton
                className={classNames(
                    " p-md rounded-button active:bg-on-primary/10",
                    "font-bold text-on-primary disabled:opacity-disabled",
                )}
                title="Skip Next"
                onClick={skipNext}
            >
                <SkipForwardIcon size={iconSize} weight="fill" />
            </AsyncButton>
        </>
    )
}
