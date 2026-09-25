import { MusicNoteIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLastfmTrack } from "@/api/queries/lastfm"
import { readRecording } from "@/api/queries/musicbrainz"
import ArtistCreditLine from "@/components/sections/ArtistCreditLine"
import CreditsSection from "@/components/sections/CreditsSection"
import EntityHeader from "@/components/sections/EntityHeader"
import ExternalLinks from "@/components/sections/ExternalLinks"
import FactList from "@/components/sections/FactList"
import ProseSection from "@/components/sections/ProseSection"
import TagsRow from "@/components/sections/TagsRow"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import SectionState from "@/components/structure/SectionState"
import useClients from "@/hooks/clientsHook"
import { MusicBrainzClient } from "@/musicbrainz/client"
import { collectRecordingCredits } from "@/musicbrainz/credits"
import { formatArtistCredit } from "@/musicbrainz/parse"
import { formatCount, formatDuration, formatYear, joinDetails } from "@/utilities/format"

export interface RecordingProps {
    readonly id: string
    readonly title?: string
}

export default function Recording({ id, title }: RecordingProps) {
    const { musicbrainz, lastfm } = useClients()
    const recordingQuery = useQuery(readRecording(musicbrainz, id))
    const recording = recordingQuery.data
    const artistName = recording ? formatArtistCredit(recording.artistCredit) : undefined
    const trackQuery = useQuery(readLastfmTrack(lastfm, artistName, recording?.title))
    const info = trackQuery.data ?? null

    if (recordingQuery.error) {
        return <ContentUnavailable variant="inline" error={recordingQuery.error} />
    }
    const works = recording?.relations.flatMap((relation) => relation.work?.title ?? []) ?? []
    return (
        <>
            <EntityHeader
                artwork={
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-300">
                        <MusicNoteIcon size="2em" aria-hidden />
                    </div>
                }
                title={recording?.title ?? title ?? "Song"}
                subtitle={
                    recording && (
                        <ArtistCreditLine credit={recording.artistCredit} fallback={artistName} />
                    )
                }
                details={
                    recording &&
                    joinDetails(
                        recording.lengthMs !== undefined
                            ? formatDuration(recording.lengthMs)
                            : undefined,
                        formatYear(recording.firstReleaseDate),
                    )
                }
            />
            {recordingQuery.isLoading && (
                <SectionState status="pending" message="Asking MusicBrainz…" />
            )}
            <ProseSection
                prose={info?.wiki ?? null}
                isPending={trackQuery.isLoading}
                maxChars={1200}
            />
            <TagsRow tags={info?.tags ?? []} limit={10} />
            <FactList
                facts={[
                    { label: "First released", value: recording?.firstReleaseDate },
                    { label: "ISRC", value: recording?.isrcs.join(", ") },
                    {
                        label: "Work",
                        value: works.filter((work) => work !== recording?.title).join(", "),
                    },
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
            <CreditsSection
                credits={recording ? collectRecordingCredits(recording) : undefined}
                isPending={recordingQuery.isLoading}
            />
            <ExternalLinks
                links={{ musicbrainz: MusicBrainzClient.recordingUrl(id) }}
                lastfmUrl={info?.url}
            />
        </>
    )
}
