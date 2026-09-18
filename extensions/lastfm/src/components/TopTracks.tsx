import { useQuery } from "@tanstack/react-query"

import { getTopTracksPeriodLabel, readTopTracks } from "@/api/queries/tracks"
import PeriodToggle from "@/components/PeriodToggle"
import ListSection from "@/components/reusable/ListSection"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import TrackRow from "@/components/TrackRow"
import useLastfmAccount from "@/hooks/accountHook"
import useLastfm from "@/hooks/lastfmHook"
import type { TopTracksPeriod } from "@/lastfm/client"
import { formatPlayCount, joinDetails } from "@/utilities/format"

export const TOP_TRACKS_TITLE = "Top Tracks"

export interface TopTracksProps {
    readonly period: TopTracksPeriod
    readonly onChangePeriod: (period: TopTracksPeriod) => void

    /** Show at most this many tracks, with a "See All" action to reveal the rest */
    readonly limit?: number

    /** Called when the "See All" action is used */
    readonly onSeeAll?: () => void
}

export default function TopTracks({ period, onChangePeriod, limit, onSeeAll }: TopTracksProps) {
    const { client } = useLastfm()
    const { session } = useLastfmAccount()
    const topQuery = useQuery(readTopTracks(client, session?.name ?? null, period, limit ? 10 : 50))

    const tracks = topQuery.data ?? []
    const isPreview = limit !== undefined
    const visibleTracks = isPreview ? tracks.slice(0, limit) : tracks
    return (
        <ListSection
            // The full list already shows the title in the header
            title={
                isPreview ? `${TOP_TRACKS_TITLE} · ${getTopTracksPeriodLabel(period)}` : undefined
            }
            action={<PeriodToggle period={period} onChange={onChangePeriod} />}
        >
            {session === null && (
                <li className="px-3 py-2 text-sm text-gray-500">Sign in to Last.fm to see this</li>
            )}
            {session !== null && topQuery.isPending && (
                <li>
                    <ContentUnavailable variant="inline" />
                </li>
            )}
            {topQuery.isError && (
                <li>
                    <ContentUnavailable variant="inline" error={topQuery.error} />
                </li>
            )}
            {topQuery.isSuccess && tracks.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">
                    Nothing scrobbled {getTopTracksPeriodLabel(period).toLowerCase()}
                </li>
            )}
            {visibleTracks.map((track, index) => (
                <TrackRow
                    key={`top[${track.artist}/${track.name}]`}
                    track={track}
                    subtitle={joinDetails(
                        track.artist,
                        track.playCount !== undefined
                            ? formatPlayCount(track.playCount)
                            : undefined,
                    )}
                    accessory={
                        <div className="w-5 shrink-0 text-end text-xs font-semibold text-gray-400 tabular-nums">
                            {index + 1}
                        </div>
                    }
                />
            ))}
            {isPreview && tracks.length > limit && (
                <li className="px-3 pt-1">
                    <button
                        type="button"
                        className="text-xs font-semibold text-[#b90000] hover:underline"
                        onClick={onSeeAll}
                    >
                        See All
                    </button>
                </li>
            )}
        </ListSection>
    )
}
