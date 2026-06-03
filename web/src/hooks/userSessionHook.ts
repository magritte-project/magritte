import type { Token } from "@magritte/api"
import type { UserSession } from "@magritte/api"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouteContext, useRouter } from "@tanstack/react-router"
import { useCallback, useMemo, useSyncExternalStore } from "react"

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
    const userSession = useRouteContext({
        from: "__root__",
        select: (context) => context.userSession,
    })
    const current = useSyncExternalStore(
        (onStoreChange) => {
            const listener = () => {
                if (
                    !userSession.isSignedIn &&
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
            userSession.addEventListener("usersessionchanged", listener)
            return () => userSession.removeEventListener("usersessionchanged", listener)
        },
        () => {
            return userSession.current
        },
    )
    const isSignedIn = useSyncExternalStore(
        (onStoreChange) => {
            userSession.addEventListener("usersessionchanged", onStoreChange)
            return () => userSession.removeEventListener("usersessionchanged", onStoreChange)
        },
        () => {
            return userSession.isSignedIn
        },
    )

    const signIn = useCallback(
        async (token: Token) => {
            userSession.current = {
                accessToken: token.access_token,
                scopes: token.scopes,
            }
        },
        [userSession],
    )
    const signOut = useCallback(async () => {
        userSession.current = null
    }, [userSession])

    const result = useMemo(
        (): UseUserSessionResult => ({ current: current, isSignedIn, signIn, signOut }),
        [current, isSignedIn, signIn, signOut],
    )

    return result
}
