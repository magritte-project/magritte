import type { PlayableItem } from "@magritte/sdk"

import AlbumSection from "@/components/nowplaying/AlbumSection"
import ArtistSection from "@/components/nowplaying/ArtistSection"
import SongSection from "@/components/nowplaying/SongSection"
import ExternalLink from "@/components/sections/ExternalLink"
import NowPlayingHeader from "@/components/sections/NowPlayingHeader"
import SectionState from "@/components/structure/SectionState"
import useHostNowPlaying from "@/hooks/hostNowPlayingHook"
import useTrackMatch from "@/hooks/trackMatchHook"
import { MusicBrainzClient } from "@/musicbrainz/client"
import { buildRecordingQuery, formatLuceneQuery } from "@/musicbrainz/match"

function NowPlayingNotes({ item }: { readonly item: PlayableItem }) {
    const { match, isPending, canMatch, error } = useTrackMatch(item)
    const query = buildRecordingQuery(item)
    return (
        <>
            <NowPlayingHeader item={item} />
            {!canMatch && (
                <SectionState
                    status="empty"
                    message="This needs a title and an artist before it can be looked up."
                />
            )}
            {isPending && <SectionState status="pending" message="Looking it up on MusicBrainz…" />}
            {error ? (
                <SectionState
                    status="error"
                    message="MusicBrainz could not be reached."
                    error={error}
                />
            ) : null}
            {match === null && canMatch && !error && (
                <div className="flex flex-col gap-1 px-3 py-2 text-xs text-gray-500">
                    <span>Not found on MusicBrainz, so there are no credits to show.</span>
                    {query && (
                        <ExternalLink href={MusicBrainzClient.searchUrl(formatLuceneQuery(query))}>
                            Search by hand
                        </ExternalLink>
                    )}
                </div>
            )}
            <SongSection item={item} match={match} />
            <AlbumSection item={item} match={match} />
            <ArtistSection item={item} match={match} />
        </>
    )
}

export default function NowPlaying() {
    const nowPlaying = useHostNowPlaying()
    // A paused song still has liner notes, a stopped player does not
    const item = nowPlaying?.state === "stopped" ? null : (nowPlaying?.item ?? null)
    if (item === null) {
        return (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
                Play something and its liner notes will show up here.
            </div>
        )
    }
    // Keyed so expanded prose and other page state start over with each song
    return <NowPlayingNotes key={String(item.id)} item={item} />
}
