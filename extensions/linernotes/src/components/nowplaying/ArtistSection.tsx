import type { PlayableItem } from "@magritte/sdk"
import { CaretRightIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLastfmArtist } from "@/api/queries/lastfm"
import { readArtist } from "@/api/queries/musicbrainz"
import { linksFromMatch } from "@/components/nowplaying/matchLinks"
import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import FactList from "@/components/sections/FactList"
import ProseSection from "@/components/sections/ProseSection"
import TagsRow from "@/components/sections/TagsRow"
import SectionState from "@/components/structure/SectionState"
import useClients from "@/hooks/clientsHook"
import useNavigation from "@/hooks/navigationHook"
import useProse from "@/hooks/proseHook"
import type { TrackMatch } from "@/model/types"
import { formatCount, formatYears, joinDetails } from "@/utilities/format"

export interface ArtistSectionProps {
    readonly item: PlayableItem
    readonly match: TrackMatch | null | undefined
}

export default function ArtistSection({ item, match }: ArtistSectionProps) {
    const { musicbrainz, lastfm } = useClients()
    const navigation = useNavigation()
    const artistId = match?.artist.id
    const artistQuery = useQuery(readArtist(musicbrainz, artistId))
    const artist = artistQuery.data
    // Waiting for the match means one lookup by id instead of one by name and one by id
    const lookup =
        match === undefined
            ? null
            : artistId
              ? { mbid: artistId }
              : item.artist_name
                ? { name: item.artist_name }
                : null
    const infoQuery = useQuery(readLastfmArtist(lastfm, lookup))
    const info = infoQuery.data ?? null
    const prose = useProse({
        links: linksFromMatch(match, artistId !== undefined, artistQuery),
        fallback: { prose: info?.bio, isPending: match === undefined || infoQuery.isLoading },
    })

    const name = artist?.name ?? match?.artist.name ?? item.artist_name
    if (!name) {
        return null
    }
    const tags = artist?.tags.map((tag) => tag.name) ?? []
    return (
        <ListSection title="Artist">
            <div className="flex flex-col px-3 pb-2">
                <div className="truncate text-sm font-bold">{name}</div>
                <div className="truncate text-xs text-gray-500">
                    {joinDetails(
                        artist?.type,
                        artist?.area,
                        artist
                            ? formatYears(
                                  artist.lifeSpan.begin,
                                  artist.lifeSpan.end,
                                  artist.lifeSpan.ended,
                              )
                            : undefined,
                    )}
                </div>
            </div>
            {match === undefined && (
                <SectionState status="pending" message="Matching the artist…" />
            )}
            {artistQuery.error ? <SectionState status="error" error={artistQuery.error} /> : null}
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
            <TagsRow tags={tags.length > 0 ? tags : (info?.tags ?? [])} />
            <ProseSection
                prose={prose.prose}
                isPending={prose.isPending}
                showThumbnail
                maxChars={400}
            />
            {artistId && (
                <ItemRow
                    title={`More about ${name}`}
                    subtitle="Members, discography and links"
                    accessory={<CaretRightIcon className="text-gray-500" aria-hidden />}
                    onClick={() => navigation.push({ kind: "artist", id: artistId, name })}
                />
            )}
        </ListSection>
    )
}
