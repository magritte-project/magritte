import { useSyncExternalStore } from "react"

import useLastfm from "@/hooks/lastfmHook"
import type { LastfmAccountState } from "@/lastfm/account"

/** The signed in Last.fm account and its preferences, kept up to date as they change */
export default function useLastfmAccount(): LastfmAccountState {
    const { account } = useLastfm()
    return useSyncExternalStore(
        (onStoreChange) => account.subscribe(onStoreChange),
        () => account.state,
    )
}
