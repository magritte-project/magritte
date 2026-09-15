import { PlayIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readCollection } from "@/api/queries/catalog"
import AddToLibraryMenu from "@/components/AddToLibraryMenu"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import { primaryButtonClassName } from "@/components/reusable/buttonStyles"
import ListSection from "@/components/reusable/ListSection"
import SongRow from "@/components/SongRow"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import useMusicKit from "@/hooks/musicKitHook"
import usePlaySongs from "@/hooks/playSongsHook"
import {
    getCollectionCreator,
    getCollectionReleaseDate,
    isPlaylistKind,
    type CollectionKind,
} from "@/musickit/models/collection"
import { formatYear, joinDetails } from "@/utilities/format"

export interface CollectionProps {
    readonly kind: CollectionKind
    readonly id: string
}

export default function Collection({ kind, id }: CollectionProps) {
    const musicKit = useMusicKit()
    const collectionQuery = useQuery(readCollection(musicKit, kind, id))
    const playSongs = usePlaySongs()

    if (collectionQuery.isPending) {
        return <ContentUnavailable variant="inline" />
    }

    if (collectionQuery.isError) {
        return <ContentUnavailable variant="inline" error={collectionQuery.error} />
    }

    const { resource, tracks } = collectionQuery.data
    const isPlaylist = isPlaylistKind(kind)
    return (
        <div>
            <div className="flex flex-col items-center gap-2 p-3 text-center">
                <ArtworkImage
                    className="w-40 aspect-square"
                    artwork={resource.attributes?.artwork}
                    itemTitle={resource.attributes?.name}
                />
                <div className="flex flex-col">
                    <div className="font-bold text-lg">{resource.attributes?.name ?? "--"}</div>
                    <div className="text-gray-700 text-sm">{getCollectionCreator(resource)}</div>
                    <div className="text-gray-500 text-xs">
                        {joinDetails(
                            formatYear(getCollectionReleaseDate(resource)),
                            `${tracks.length} ${tracks.length === 1 ? "song" : "songs"}`,
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={primaryButtonClassName}
                        disabled={tracks.length === 0}
                        onClick={() => playSongs(tracks)}
                    >
                        <PlayIcon weight="fill" /> Play
                    </button>
                    <AddToLibraryMenu variant="button" songs={tracks} />
                </div>
            </div>
            <ListSection>
                {tracks.map((track, index) => (
                    <SongRow
                        key={`tracks[${track.id}@${index}]`}
                        song={track}
                        leading={
                            isPlaylist ? undefined : (
                                <span className="w-6 shrink-0 text-end text-xs tabular-nums text-gray-500">
                                    {track.attributes?.trackNumber ?? index + 1}
                                </span>
                            )
                        }
                        subtitle={isPlaylist ? undefined : (track.attributes?.artistName ?? "")}
                        onPlay={() => playSongs(tracks, track)}
                    />
                ))}
            </ListSection>
        </div>
    )
}
