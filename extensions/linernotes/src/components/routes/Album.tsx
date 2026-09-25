import { useQuery } from "@tanstack/react-query"

import { readLastfmAlbum } from "@/api/queries/lastfm"
import { readReleaseForAlbum, readReleaseGroup } from "@/api/queries/musicbrainz"
import ArtistCreditLine from "@/components/sections/ArtistCreditLine"
import CoverArt from "@/components/sections/CoverArt"
import CreditsSection from "@/components/sections/CreditsSection"
import EntityHeader from "@/components/sections/EntityHeader"
import ExternalLinks from "@/components/sections/ExternalLinks"
import FactList from "@/components/sections/FactList"
import ProseSection from "@/components/sections/ProseSection"
import TagsRow from "@/components/sections/TagsRow"
import TrackListSection from "@/components/sections/TrackListSection"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import SectionState from "@/components/structure/SectionState"
import useClients from "@/hooks/clientsHook"
import useProse from "@/hooks/proseHook"
import { collectReleaseCredits } from "@/musicbrainz/credits"
import { formatArtistCredit } from "@/musicbrainz/parse"
import { formatCount, formatYear, joinDetails } from "@/utilities/format"

export interface AlbumProps {
    readonly releaseGroupId: string
    readonly releaseId?: string
    readonly title?: string
    /** The recording playing, to point out in the track list */
    readonly currentRecordingId?: string
}

export default function Album({
    releaseGroupId,
    releaseId,
    title,
    currentRecordingId,
}: AlbumProps) {
    const { musicbrainz, lastfm } = useClients()
    const releaseGroupQuery = useQuery(readReleaseGroup(musicbrainz, releaseGroupId))
    const releaseGroup = releaseGroupQuery.data
    const releaseQuery = useQuery(readReleaseForAlbum(musicbrainz, releaseGroup, releaseId))
    const release = releaseQuery.data
    const artistName = releaseGroup ? formatArtistCredit(releaseGroup.artistCredit) : undefined
    const albumQuery = useQuery(readLastfmAlbum(lastfm, artistName, releaseGroup?.title))
    const album = albumQuery.data ?? null
    const prose = useProse({
        links: releaseGroup?.links ?? (releaseGroupQuery.isLoading ? undefined : null),
        fallback: {
            prose: album?.wiki,
            isPending: releaseGroupQuery.isLoading || albumQuery.isLoading,
        },
    })

    if (releaseGroupQuery.error) {
        return <ContentUnavailable variant="inline" error={releaseGroupQuery.error} />
    }
    const tags = releaseGroup?.tags.map((tag) => tag.name) ?? []
    const label = release?.labels[0]
    return (
        <>
            <EntityHeader
                artwork={
                    <CoverArt
                        className="h-16 w-16 shrink-0"
                        entity={{ kind: "release-group", id: releaseGroupId }}
                        fallbackUrl={album?.imageUrl}
                        itemTitle={releaseGroup?.title ?? title}
                    />
                }
                title={releaseGroup?.title ?? title ?? "Album"}
                subtitle={
                    releaseGroup && (
                        <ArtistCreditLine
                            credit={releaseGroup.artistCredit}
                            fallback={artistName}
                        />
                    )
                }
                details={
                    releaseGroup &&
                    joinDetails(
                        releaseGroup.primaryType,
                        releaseGroup.secondaryTypes.join(", "),
                        formatYear(releaseGroup.firstReleaseDate),
                    )
                }
            />
            {releaseGroupQuery.isLoading && (
                <SectionState status="pending" message="Asking MusicBrainz…" />
            )}
            <ProseSection
                prose={prose.prose}
                isPending={prose.isPending}
                maxChars={1200}
                emptyMessage="Nothing has been written about this album yet."
            />
            <TagsRow tags={tags.length > 0 ? tags : (album?.tags ?? [])} limit={10} />
            <FactList
                facts={[
                    { label: "Released", value: release?.date ?? releaseGroup?.firstReleaseDate },
                    { label: "Label", value: label?.name },
                    { label: "Catalog", value: label?.catalogNumber },
                    {
                        label: "Edition",
                        value: release && joinDetails(release.country, release.disambiguation),
                    },
                    {
                        label: "Listeners",
                        value: album ? formatCount(album.stats.listeners, "listener") : undefined,
                    },
                    {
                        label: "Plays",
                        value: album ? formatCount(album.stats.playCount, "play") : undefined,
                    },
                ]}
            />
            {releaseQuery.isLoading && (
                <SectionState status="pending" message="Reading the tracks and credits…" />
            )}
            {releaseQuery.error ? <SectionState status="error" error={releaseQuery.error} /> : null}
            {release && (
                <TrackListSection release={release} currentRecordingId={currentRecordingId} />
            )}
            {release && (
                <CreditsSection credits={collectReleaseCredits(release)} isPending={false} />
            )}
            <ExternalLinks
                links={releaseGroup?.links}
                wikipediaUrl={
                    prose.prose?.source === "wikipedia" ? prose.prose.sourceUrl : undefined
                }
                lastfmUrl={album?.url}
            />
        </>
    )
}
