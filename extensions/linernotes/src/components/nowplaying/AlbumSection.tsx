import type { PlayableItem } from "@magritte/sdk"
import { CaretRightIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLastfmAlbum } from "@/api/queries/lastfm"
import { readReleaseGroup } from "@/api/queries/musicbrainz"
import { linksFromMatch } from "@/components/nowplaying/matchLinks"
import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import CoverArt from "@/components/sections/CoverArt"
import FactList from "@/components/sections/FactList"
import ProseSection from "@/components/sections/ProseSection"
import TagsRow from "@/components/sections/TagsRow"
import SectionState from "@/components/structure/SectionState"
import useClients from "@/hooks/clientsHook"
import useNavigation from "@/hooks/navigationHook"
import useProse from "@/hooks/proseHook"
import type { TrackMatch } from "@/model/types"
import { formatCount, formatYear, joinDetails } from "@/utilities/format"

export interface AlbumSectionProps {
    readonly item: PlayableItem
    readonly match: TrackMatch | null | undefined
}

export default function AlbumSection({ item, match }: AlbumSectionProps) {
    const { musicbrainz, lastfm } = useClients()
    const navigation = useNavigation()
    const releaseGroupId = match?.releaseGroup?.id
    const releaseGroupQuery = useQuery(readReleaseGroup(musicbrainz, releaseGroupId))
    const releaseGroup = releaseGroupQuery.data
    const albumQuery = useQuery(readLastfmAlbum(lastfm, item.artist_name, item.album_title))
    const album = albumQuery.data ?? null
    const prose = useProse({
        links: linksFromMatch(match, releaseGroupId !== undefined, releaseGroupQuery),
        fallback: { prose: album?.wiki, isPending: albumQuery.isLoading },
    })

    const title = releaseGroup?.title ?? match?.releaseGroup?.name ?? item.album_title
    if (!title) {
        return null
    }
    const tags = releaseGroup?.tags.map((tag) => tag.name) ?? []
    return (
        <ListSection title="Album">
            <div className="flex items-center gap-3 px-3 pb-2">
                <CoverArt
                    className="h-12 w-12 shrink-0"
                    entity={
                        releaseGroupId ? { kind: "release-group", id: releaseGroupId } : undefined
                    }
                    fallbackUrl={item.artworks?.[0]?.image_url ?? album?.imageUrl}
                    itemTitle={title}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="truncate text-sm font-bold">{title}</div>
                    <div className="truncate text-xs text-gray-500">
                        {joinDetails(
                            releaseGroup?.primaryType,
                            releaseGroup?.secondaryTypes.join(", "),
                            formatYear(releaseGroup?.firstReleaseDate ?? item.release_date),
                        )}
                    </div>
                </div>
            </div>
            {match === undefined && <SectionState status="pending" message="Matching the album…" />}
            {releaseGroupQuery.error ? (
                <SectionState status="error" error={releaseGroupQuery.error} />
            ) : null}
            <FactList
                facts={[
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
            <TagsRow tags={tags.length > 0 ? tags : (album?.tags ?? [])} />
            <ProseSection prose={prose.prose} isPending={prose.isPending} maxChars={400} />
            {releaseGroupId && (
                <ItemRow
                    title="Credits & tracks"
                    subtitle="Everyone on the record"
                    accessory={<CaretRightIcon className="text-gray-500" aria-hidden />}
                    onClick={() =>
                        navigation.push({
                            kind: "album",
                            releaseGroupId,
                            releaseId: match?.release?.id,
                            title,
                        })
                    }
                />
            )}
        </ListSection>
    )
}
