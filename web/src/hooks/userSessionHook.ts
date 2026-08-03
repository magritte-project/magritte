import type { Token, UserSession } from "@magritte/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useCallback, useMemo, useSyncExternalStore } from "react"

import useAPI from "@/hooks/apiHook"

export interface UseUserSessionResult {
    readonly current: UserSession | null
    readonly isSignedIn: boolean
    readonly signIn: (token: Token) => Promise<void>
    readonly signOut: () => Promise<void>
}

export default function useUserSession(): UseUserSessionResult {
    const router = useRouter()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { userSessionManager } = useAPI()
    const current = useSyncExternalStore(
        (onStoreChange) => {
            const listener = () => {
                if (
                    !userSessionManager.isSignedIn &&
                    !router.state.matches.some((match) => match.staticData.noAuth === true)
                ) {
                    // NOTE: We must redirect before invalidating the queries
                    //       or we can end up in an infinite loop.
                    setTimeout(() => {
                        navigate({ to: "/sign-in" })
                    }, 16)
                } else {
                    onStoreChange()
                    queryClient.clear()
                }
            }
            userSessionManager.addEventListener("usersessionchanged", listener)
            return () => userSessionManager.removeEventListener("usersessionchanged", listener)
        },
        () => {
            return userSessionManager.current
        },
    )
    const isSignedIn = useSyncExternalStore(
        (onStoreChange) => {
            userSessionManager.addEventListener("usersessionchanged", onStoreChange)
            return () => userSessionManager.removeEventListener("usersessionchanged", onStoreChange)
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
