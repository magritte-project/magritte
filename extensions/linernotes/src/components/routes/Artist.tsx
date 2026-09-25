import { UserIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLastfmArtist } from "@/api/queries/lastfm"
import { readArtist, readDiscography } from "@/api/queries/musicbrainz"
import DiscographySection from "@/components/sections/DiscographySection"
import EntityHeader from "@/components/sections/EntityHeader"
import ExternalLinks from "@/components/sections/ExternalLinks"
import FactList from "@/components/sections/FactList"
import MembersSection from "@/components/sections/MembersSection"
import ProseSection from "@/components/sections/ProseSection"
import SimilarArtistsSection from "@/components/sections/SimilarArtistsSection"
import TagsRow from "@/components/sections/TagsRow"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import SectionState from "@/components/structure/SectionState"
import useClients from "@/hooks/clientsHook"
import useProse from "@/hooks/proseHook"
import { formatCount, formatYears, joinDetails } from "@/utilities/format"

export interface ArtistProps {
    readonly id: string
    readonly name?: string
}

export default function Artist({ id, name }: ArtistProps) {
    const { musicbrainz, lastfm } = useClients()
    const artistQuery = useQuery(readArtist(musicbrainz, id))
    const artist = artistQuery.data
    const discographyQuery = useQuery(readDiscography(musicbrainz, id))
    const infoQuery = useQuery(readLastfmArtist(lastfm, { mbid: id }))
    const info = infoQuery.data ?? null
    const prose = useProse({
        links: artist?.links ?? (artistQuery.isLoading ? undefined : null),
        fallback: { prose: info?.bio, isPending: infoQuery.isLoading },
    })

    if (artistQuery.error) {
        return <ContentUnavailable variant="inline" error={artistQuery.error} />
    }
    const isGroup = artist?.type !== "Person"
    const Icon = isGroup ? UsersThreeIcon : UserIcon
    const tags = artist?.tags.map((tag) => tag.name) ?? []
    return (
        <>
            <EntityHeader
                artwork={
                    prose.prose?.thumbnailUrl ? (
                        <img
                            className="h-16 w-16 shrink-0 rounded-md border border-black/10 object-cover"
                            src={prose.prose.thumbnailUrl}
                            alt=""
                        />
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-300">
                            <Icon size="2em" aria-hidden />
                        </div>
                    )
                }
                title={artist?.name ?? name ?? "Artist"}
                subtitle={artist?.disambiguation}
                details={
                    artist &&
                    joinDetails(
                        artist.type,
                        artist.area ?? artist.country,
                        formatYears(
                            artist.lifeSpan.begin,
                            artist.lifeSpan.end,
                            artist.lifeSpan.ended,
                        ),
                    )
                }
            />
            {artistQuery.isLoading && (
                <SectionState status="pending" message="Asking MusicBrainz…" />
            )}
            <ProseSection
                prose={prose.prose}
                isPending={prose.isPending}
                maxChars={1200}
                emptyMessage="Nothing has been written about this artist yet."
            />
            <TagsRow tags={tags.length > 0 ? tags : (info?.tags ?? [])} limit={10} />
            <FactList
                facts={[
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
            {artist && <MembersSection title="Members" memberships={artist.members} />}
            {artist && <MembersSection title="Member of" memberships={artist.memberOf} />}
            <DiscographySection
                releaseGroups={discographyQuery.data}
                isPending={discographyQuery.isLoading}
                error={discographyQuery.error}
            />
            <SimilarArtistsSection similar={info?.similar ?? []} />
            <ExternalLinks
                links={artist?.links}
                wikipediaUrl={
                    prose.prose?.source === "wikipedia" ? prose.prose.sourceUrl : undefined
                }
                lastfmUrl={info?.url}
            />
        </>
    )
}
