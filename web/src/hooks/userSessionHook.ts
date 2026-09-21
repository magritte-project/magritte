import type { Token, UserSession } from "@magritte/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useSyncExternalStore } from "react"

import useAPI from "@/hooks/apiHook"
import { justEventsMatching } from "@/utilities/events"

export interface UseUserSessionResult {
    readonly current: UserSession | null
    readonly isSignedIn: boolean
    readonly signIn: (token: Token) => Promise<void>
    readonly signOut: () => Promise<void>
}

export default function useUserSession(): UseUserSessionResult {
    const queryClient = useQueryClient()
    const { userSessionManager } = useAPI()
    const current = useSyncExternalStore(
        (onStoreChange) => {
            const listener = () => {
                queryClient.clear()
                onStoreChange()
            }
            return userSessionManager.subscribe(
                justEventsMatching("type", "currentChanged", listener),
            )
        },
        () => {
            return userSessionManager.current
        },
    )
    const isSignedIn = useSyncExternalStore(
        (onStoreChange) => {
            return userSessionManager.subscribe(
                justEventsMatching("type", "currentChanged", onStoreChange),
            )
        },
        () => {
            return userSessionManager.isSignedIn
        },
    )

    const signIn = useCallback(
        async (token: Token) => {
            userSessionManager.current = {
                accessToken: token.access_token,
                scopes: token.scopes,
            }
        },
        [userSessionManager],
    )
    const signOut = useCallback(async () => {
        userSessionManager.current = null
    }, [userSessionManager])

    const result = useMemo(
        (): UseUserSessionResult => ({ current: current, isSignedIn, signIn, signOut }),
        [current, isSignedIn, signIn, signOut],
    )

    return result
}
