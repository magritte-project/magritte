import type { PlayableItem } from "@magritte/sdk"
import { queryOptions, skipToken } from "@tanstack/react-query"

import {
    mbArtist,
    mbDiscography,
    mbRecording,
    mbRelease,
    mbReleaseGroup,
    mbTrackMatch,
} from "@/api/keys/musicbrainz"
import type { ReleaseGroup, TrackMatch } from "@/model/types"
import { MusicBrainzClient, MusicBrainzError } from "@/musicbrainz/client"
import { buildRecordingQuery, chooseRecordingMatch } from "@/musicbrainz/match"
import { chooseRepresentativeRelease } from "@/musicbrainz/releases"
import { normalizeForMatch } from "@/utilities/text"

/**
 * MusicBrainz entities do not change while the panel is open, and every call
 * costs a second of rate limit, so results are kept for as long as possible.
 * A missing entity stays missing, so that is the one failure not worth retrying.
 */
const entityOptions = {
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
    retry: (failureCount: number, error: unknown) =>
        !(error instanceof MusicBrainzError && error.isNotFound) && failureCount < 1,
} as const

/** Which MusicBrainz recording the playing item is, or null when none fits */
export function readTrackMatch(client: MusicBrainzClient, item: PlayableItem | null) {
    const query = buildRecordingQuery(item)
    // Keyed by what the search depends on, so editions of the same song share a lookup
    const key =
        query === null || item === null
            ? null
            : {
                  title: normalizeForMatch(query.title),
                  artist: normalizeForMatch(query.artist),
                  album: normalizeForMatch(query.album),
                  trackNumber: item.track_number ?? null,
              }
    return queryOptions({
        queryKey: mbTrackMatch(key),
        ...entityOptions,
        queryFn:
            query === null || item === null
                ? skipToken
                : async (): Promise<TrackMatch | null> => {
                      const match = chooseRecordingMatch(await client.searchRecordings(query), item)
                      // The album is a hint: a compilation or a differently named
                      // reissue can hide the song behind a title MusicBrainz does not use
                      if (match === null && query.album !== undefined) {
                          const hits = await client.searchRecordings({ ...query, album: undefined })
                          return chooseRecordingMatch(hits, item)
                      }
                      return match
                  },
    })
}

export function readArtist(client: MusicBrainzClient, id: string | null | undefined) {
    return queryOptions({
        queryKey: mbArtist(id ?? null),
        ...entityOptions,
        queryFn: id ? async () => await client.getArtist(id) : skipToken,
    })
}

export function readReleaseGroup(client: MusicBrainzClient, id: string | null | undefined) {
    return queryOptions({
        queryKey: mbReleaseGroup(id ?? null),
        ...entityOptions,
        queryFn: id ? async () => await client.getReleaseGroup(id) : skipToken,
    })
}

export function readRelease(client: MusicBrainzClient, id: string | null | undefined) {
    return queryOptions({
        queryKey: mbRelease(id ?? null),
        ...entityOptions,
        queryFn: id ? async () => await client.getRelease(id) : skipToken,
    })
}

/**
 * The release worth showing for an album. A known release, e.g. the one the
 * playing track was matched to, is used as is: the group only lists its first
 * 25 releases, so it may well be missing from there.
 */
export function readReleaseForAlbum(
    client: MusicBrainzClient,
    releaseGroup: ReleaseGroup | undefined,
    preferredReleaseId?: string,
) {
    const release =
        releaseGroup !== undefined ? chooseRepresentativeRelease(releaseGroup.releases) : undefined
    return readRelease(client, preferredReleaseId ?? release?.id)
}

export function readRecording(client: MusicBrainzClient, id: string | null | undefined) {
    return queryOptions({
        queryKey: mbRecording(id ?? null),
        ...entityOptions,
        queryFn: id ? async () => await client.getRecording(id) : skipToken,
    })
}

export function readDiscography(client: MusicBrainzClient, artistId: string | null | undefined) {
    return queryOptions({
        queryKey: mbDiscography(artistId ?? null),
        ...entityOptions,
        queryFn: artistId ? async () => await client.browseReleaseGroups(artistId) : skipToken,
    })
}
