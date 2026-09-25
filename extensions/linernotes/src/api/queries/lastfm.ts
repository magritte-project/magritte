import { queryOptions, skipToken } from "@tanstack/react-query"

import { lastfmAlbum, lastfmArtist, lastfmTrack } from "@/api/keys/lastfm"
import type { LastfmArtistLookup, LastfmClient } from "@/lastfm/client"

/** Listener counts move, but not enough to be worth asking again while browsing */
const infoOptions = {
    staleTime: 30 * 60_000,
    retry: false,
} as const

export function readLastfmArtist(client: LastfmClient, lookup: LastfmArtistLookup | null) {
    const enabled = client.hasCredentials && lookup !== null
    return queryOptions({
        queryKey: lastfmArtist(lookup),
        ...infoOptions,
        queryFn: enabled ? async () => await client.getArtistInfo(lookup) : skipToken,
    })
}

export function readLastfmAlbum(
    client: LastfmClient,
    artist: string | null | undefined,
    album: string | null | undefined,
) {
    const enabled = client.hasCredentials && Boolean(artist && album)
    return queryOptions({
        queryKey: lastfmAlbum(artist ?? null, album ?? null),
        ...infoOptions,
        queryFn: enabled ? async () => await client.getAlbumInfo(artist!, album!) : skipToken,
    })
}

export function readLastfmTrack(
    client: LastfmClient,
    artist: string | null | undefined,
    track: string | null | undefined,
) {
    const enabled = client.hasCredentials && Boolean(artist && track)
    return queryOptions({
        queryKey: lastfmTrack(artist ?? null, track ?? null),
        ...infoOptions,
        queryFn: enabled ? async () => await client.getTrackInfo(artist!, track!) : skipToken,
    })
}
