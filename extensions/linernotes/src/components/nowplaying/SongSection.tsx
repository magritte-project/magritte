import type { PlayableItem } from "@magritte/sdk"
import { CaretRightIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLastfmTrack } from "@/api/queries/lastfm"
import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import FactList from "@/components/sections/FactList"
import ProseSection from "@/components/sections/ProseSection"
import TagsRow from "@/components/sections/TagsRow"
import useClients from "@/hooks/clientsHook"
import useNavigation from "@/hooks/navigationHook"
import type { TrackMatch } from "@/model/types"
import { formatCount, formatDuration } from "@/utilities/format"

export interface SongSectionProps {
    readonly item: PlayableItem
    readonly match: TrackMatch | null | undefined
}

export default function SongSection({ item, match }: SongSectionProps) {
    const { lastfm } = useClients()
    const navigation = useNavigation()
    const trackQuery = useQuery(readLastfmTrack(lastfm, item.artist_name, item.title))
    const info = trackQuery.data ?? null

    const playingMs = (item.end_time - (item.start_time ?? 0)) * 1000
    const durationMs = info?.durationMs ?? playingMs
    return (
        <ListSection title="Song">
            <FactList
                facts={[
                    { label: "Length", value: durationMs ? formatDuration(durationMs) : undefined },
                    {
                        label: "Listeners",
                        value: info ? formatCount(info.stats.listeners, "listener") : undefined,
                    },
                    {
                        label: "Plays",
                        value: info ? formatCount(info.stats.playCount, "play") : undefined,
                    },
                ]}
            />
            <TagsRow tags={info?.tags ?? []} />
            <ProseSection
                prose={info?.wiki ?? null}
                isPending={trackQuery.isLoading}
                maxChars={400}
            />
            {match?.recording && (
                <ItemRow
                    title="Credits & details"
                    subtitle="Who wrote, played and produced it"
                    accessory={<CaretRightIcon className="text-gray-500" aria-hidden />}
                    onClick={() =>
                        navigation.push({
                            kind: "recording",
                            id: match.recording.id,
                            title: match.recording.name,
                        })
                    }
                />
            )}
        </ListSection>
    )
}
