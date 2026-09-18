import { useQuery } from "@tanstack/react-query"

import { readRecentTracks } from "@/api/queries/tracks"
import ListSection from "@/components/reusable/ListSection"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import TrackRow from "@/components/TrackRow"
import useLastfmAccount from "@/hooks/accountHook"
import useLastfm from "@/hooks/lastfmHook"
import { formatRelativeTime, joinDetails } from "@/utilities/format"

export const RECENT_TRACKS_TITLE = "Recently Scrobbled"

export interface RecentTracksProps {
    /** Show at most this many tracks, with a "See All" action to reveal the rest */
    readonly limit?: number

    /** Called when the "See All" action is used */
    readonly onSeeAll?: () => void
}

export default function RecentTracks({ limit, onSeeAll }: RecentTracksProps) {
    const { client } = useLastfm()
    const { session } = useLastfmAccount()
    // The full list is worth a deeper look back than the preview on the home view
    const recentQuery = useQuery(readRecentTracks(client, session?.name ?? null, limit ? 10 : 50))

    const tracks = recentQuery.data ?? []
    const isPreview = limit !== undefined
    const visibleTracks = isPreview ? tracks.slice(0, limit) : tracks
    return (
        <ListSection
            // The full list already shows the title in the header
            title={isPreview ? RECENT_TRACKS_TITLE : undefined}
            action={
                isPreview &&
                tracks.length > limit && (
                    <button
                        type="button"
                        className="text-xs font-semibold text-[#b90000] hover:underline"
                        onClick={onSeeAll}
                    >
                        See All
                    </button>
                )
            }
        >
            {session === null && (
                <li className="px-3 py-2 text-sm text-gray-500">Sign in to Last.fm to see this</li>
            )}
            {session !== null && recentQuery.isPending && (
                <li>
                    <ContentUnavailable variant="inline" />
                </li>
            )}
            {recentQuery.isError && (
                <li>
                    <ContentUnavailable variant="inline" error={recentQuery.error} />
                </li>
            )}
            {recentQuery.isSuccess && tracks.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">Nothing scrobbled yet</li>
            )}
            {visibleTracks.map((track, index) => (
                <TrackRow
                    key={`recent[${track.artist}/${track.name}@${track.scrobbledAt ?? index}]`}
                    track={track}
                    subtitle={joinDetails(
                        track.artist,
                        track.isNowPlaying
                            ? "Scrobbling now"
                            : track.scrobbledAt !== undefined
                              ? formatRelativeTime(track.scrobbledAt)
                              : undefined,
                    )}
                />
            ))}
        </ListSection>
    )
}
