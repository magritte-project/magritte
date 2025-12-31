import { useCreateArtwork } from "@/api/mutations/artwork"
import {
    useCreateLibraryAlbum,
    useCreateLibraryArtist,
    useCreateLibrarySong,
} from "@/api/mutations/libraries"
import { useCreateSource } from "@/api/mutations/sources"
import type { ServiceSongRead, SongRead } from "@/api/openapi"
import { useCallback } from "react"

export interface UseAddServiceSongOptions {
    readonly libraryId: number
}

export interface UseAddServiceSongResult {
    readonly addServiceSong: (song: ServiceSongRead) => Promise<SongRead>
}

export default function useAddServiceSong({
    libraryId,
}: UseAddServiceSongOptions): UseAddServiceSongResult {
    const createSourceMutation = useCreateSource()
    const createArtwork = useCreateArtwork()
    const createLibraryArtist = useCreateLibraryArtist(libraryId)
    const createLibraryAlbum = useCreateLibraryAlbum(libraryId)
    const createLibrarySong = useCreateLibrarySong(libraryId)
    const addServiceSong = useCallback(
        async (song: ServiceSongRead) => {
            let artistId: number | undefined
            if (song.artist_name) {
                const artist = await createLibraryArtist.mutateAsync({
                    name: song.artist_name,
                })
                artistId = artist.id
            }
            let albumId: number | undefined
            if (song.album_title) {
                const album = await createLibraryAlbum.mutateAsync({
                    title: song.album_title,
                    artist_id: artistId ?? null,
                })
                albumId = album.id
            }

            const artworkIds: number[] = []
            for (const artwork of song.artworks) {
                const newArtwork = await createArtwork.mutateAsync(artwork)
                artworkIds.push(newArtwork.id)
            }

            const sourceIds: number[] = []
            for (const source of song.sources) {
                const newSource = await createSourceMutation.mutateAsync({
                    url: source.url,
                    mime_type: null,
                })
                sourceIds.push(newSource.id)
            }

            return await createLibrarySong.mutateAsync({
                artist_id: artistId ?? null,
                album_id: albumId ?? null,
                artwork_ids: artworkIds,
                source_ids: sourceIds,
                start_time: 0,
                end_time: song.duration,
                title: song.title,
                album_artist: song.album_artist,
                composer: song.composer,
                genre: song.genre,
                release_date: song.release_date,
                track_number: song.track_number,
                track_total: song.track_total,
                disc_number: song.disc_number,
                disc_total: song.disc_total,
                lyrics: song.lyrics,
                rating: null,
                bpm: song.bpm,
                comment: null,
                grouping: song.grouping,
                mcn: song.mcn,
                isrc: song.isrc,
                music_brainz_release_id: song.music_brainz_release_id,
                music_brainz_recording_id: song.music_brainz_recording_id,
            })
        },
        [
            createSourceMutation,
            createArtwork,
            createLibraryArtist,
            createLibraryAlbum,
            createLibrarySong,
        ],
    )
    return { addServiceSong }
}
