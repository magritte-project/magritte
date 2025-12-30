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

            const source = await createSourceMutation.mutateAsync({
                url: song.source_url,
                mime_type: null,
            })

            return await createLibrarySong.mutateAsync({
                artist_id: artistId ?? null,
                album_id: albumId ?? null,
                artwork_ids: [],
                source_ids: [source.id],
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
            createLibraryArtist,
            createLibraryAlbum,
            createLibrarySong,
        ],
    )
    return { addServiceSong }
}
