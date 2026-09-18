import { useSyncExternalStore } from "react"

import useLastfm from "@/hooks/lastfmHook"

/** How many scrobbles are waiting to be submitted, kept up to date as that changes */
export default function usePendingScrobbleCount(): number {
    const { scrobbler } = useLastfm()
    return useSyncExternalStore(
        (onStoreChange) => scrobbler.subscribe(onStoreChange),
        () => scrobbler.pendingCount,
    )
}
