import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"

import { searchCatalog } from "@/api/queries/search"
import ArtistRow from "@/components/ArtistRow"
import CollectionRow from "@/components/CollectionRow"
import ListSection from "@/components/reusable/ListSection"
import SongRow from "@/components/SongRow"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import useMusicKit from "@/hooks/musicKitHook"
import usePlaySongs from "@/hooks/playSongsHook"

export interface SearchProps {
    /** The search term, which is edited from the toolbar */
    readonly query: string
}

export default function Search({ query }: SearchProps) {
    const debouncedQuery = useDebounce(query.trim(), 200)

    const musicKit = useMusicKit()
    const searchQuery = useQuery({
        ...searchCatalog(musicKit, debouncedQuery),
        placeholderData: keepPreviousData,
    })
    const playSongs = usePlaySongs()

    const results = searchQuery.data
    if (searchQuery.isError) {
        return <ContentUnavailable variant="inline" error={searchQuery.error} />
    }
    if (!debouncedQuery) {
        return null
    }
    if (results === undefined) {
        return <ContentUnavailable variant="inline" />
    }
    if (results.artists.length + results.albums.length + results.songs.length === 0) {
        return (
            <p className="px-3 py-2 text-center text-sm text-gray-500">
                No results for "{debouncedQuery}"
            </p>
        )
    }
    return (
        <>
            {results.artists.length > 0 && (
                <ListSection title="Artists">
                    {results.artists.map((artist, index) => (
                        <ArtistRow key={`artists[${artist.id}@${index}]`} artist={artist} />
                    ))}
                </ListSection>
            )}
            {results.albums.length > 0 && (
                <ListSection title="Albums">
                    {results.albums.map((album, index) => (
                        <CollectionRow key={`albums[${album.id}@${index}]`} collection={album} />
                    ))}
                </ListSection>
            )}
            {results.songs.length > 0 && (
                <ListSection title="Songs">
                    {results.songs.map((song, index) => (
                        <SongRow
                            key={`songs[${song.id}@${index}]`}
                            song={song}
                            onPlay={() => playSongs([song])}
                        />
                    ))}
                </ListSection>
            )}
        </>
    )
}
