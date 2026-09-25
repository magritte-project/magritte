import classNames from "classnames"

import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import useNavigation from "@/hooks/navigationHook"
import type { Release } from "@/model/types"
import { formatDuration, joinDetails } from "@/utilities/format"

export interface TrackListSectionProps {
    readonly release: Release
    /** The recording to point out, e.g. the one playing */
    readonly currentRecordingId?: string
}

export default function TrackListSection({ release, currentRecordingId }: TrackListSectionProps) {
    const navigation = useNavigation()
    return (
        <>
            {release.media.map((medium) => (
                <ListSection
                    key={medium.position}
                    title={
                        release.media.length > 1
                            ? joinDetails(`Disc ${medium.position}`, medium.format)
                            : "Tracks"
                    }
                >
                    {medium.tracks.map((track) => {
                        const isCurrent = track.recording.id === currentRecordingId
                        return (
                            <ItemRow
                                key={track.id}
                                leading={
                                    <span
                                        className={classNames(
                                            "w-6 shrink-0 text-end text-xs tabular-nums",
                                            isCurrent ? "font-bold text-gray-900" : "text-gray-500",
                                        )}
                                    >
                                        {track.number}
                                    </span>
                                }
                                title={track.title}
                                accessory={
                                    track.lengthMs !== undefined && (
                                        <span className="text-xs tabular-nums text-gray-500">
                                            {formatDuration(track.lengthMs)}
                                        </span>
                                    )
                                }
                                onClick={() =>
                                    navigation.push({
                                        kind: "recording",
                                        id: track.recording.id,
                                        title: track.title,
                                    })
                                }
                            />
                        )
                    })}
                </ListSection>
            ))}
        </>
    )
}
