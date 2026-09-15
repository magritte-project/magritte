import { useQuery } from "@tanstack/react-query"

import { readArtist } from "@/api/queries/catalog"
import CollectionRow from "@/components/CollectionRow"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ListSection from "@/components/reusable/ListSection"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import useMusicKit from "@/hooks/musicKitHook"
import { formatYear } from "@/utilities/format"

export interface ArtistProps {
    readonly id: string
}

export default function Artist({ id }: ArtistProps) {
    const musicKit = useMusicKit()
    const artistQuery = useQuery(readArtist(musicKit, id))

    if (artistQuery.isPending) {
        return <ContentUnavailable variant="inline" />
    }

    if (artistQuery.isError) {
        return <ContentUnavailable variant="inline" error={artistQuery.error} />
    }

    const { artist, albums, singlesAndEPs } = artistQuery.data
    const sections = [
        { title: "Albums", albums },
        { title: "Singles & EPs", albums: singlesAndEPs },
    ]
    return (
        <div>
            <div className="flex flex-col items-center gap-2 p-3 text-center">
                <ArtworkImage
                    className="w-32 aspect-square"
                    shape="circle"
                    artwork={artist.attributes?.artwork}
                    itemTitle={artist.attributes?.name}
                />
                <div className="flex flex-col">
                    <div className="font-bold text-lg">{artist.attributes?.name ?? "--"}</div>
                    {artist.attributes?.genreNames?.[0] && (
                        <div className="text-gray-700 text-xs">
                            {artist.attributes.genreNames[0]}
                        </div>
                    )}
                </div>
            </div>
            {albums.length === 0 && singlesAndEPs.length === 0 && (
                <p className="px-3 py-2 text-center text-sm text-gray-500">No albums</p>
            )}
            {sections.map(
                ({ title, albums }) =>
                    albums.length > 0 && (
                        <ListSection key={title} title={title}>
                            {albums.map((album, index) => (
                                <CollectionRow
                                    key={`albums[${album.id}@${index}]`}
                                    collection={album}
                                    subtitle={formatYear(album.attributes?.releaseDate)}
                                />
                            ))}
                        </ListSection>
                    ),
            )}
        </div>
    )
}
