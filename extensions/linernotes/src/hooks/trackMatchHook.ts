import type { PlayableItem } from "@magritte/sdk"
import { useQuery } from "@tanstack/react-query"

import { readTrackMatch } from "@/api/queries/musicbrainz"
import useClients from "@/hooks/clientsHook"
import useDebouncedValue from "@/hooks/debouncedValueHook"
import type { TrackMatch } from "@/model/types"

/** Long enough that skipping through tracks does not queue a search for each */
const SETTLE_DELAY_MS = 400

export interface TrackMatchState {
    /** `undefined` while looking, `null` when nothing on MusicBrainz fits */
    readonly match: TrackMatch | null | undefined
    readonly isPending: boolean
    readonly error: unknown
    /** Whether the item has enough detail to look up at all */
    readonly canMatch: boolean
}

export default function useTrackMatch(item: PlayableItem | null): TrackMatchState {
    const { musicbrainz } = useClients()
    const settled = useDebouncedValue(item, SETTLE_DELAY_MS)
    const options = readTrackMatch(musicbrainz, settled)
    const query = useQuery(options)
    const canMatch = options.queryFn !== undefined && typeof options.queryFn === "function"
    const isPending = settled !== item || (canMatch && query.isPending)
    return {
        match: isPending ? undefined : (query.data ?? null),
        isPending,
        error: query.error,
        canMatch,
    }
}
