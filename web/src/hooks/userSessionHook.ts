import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouteContext, useRouter } from "@tanstack/react-router"
import { useCallback, useMemo, useSyncExternalStore } from "react"

import type { Token } from "@/api/openapi"
import type { UserSession } from "@/api/userSession"

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
            const subscription = userSession.$current.subscribe((current) => {
                if (
                    current === null &&
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
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return userSession.current
        },
    )
    const isSignedIn = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = userSession.$isSignedIn.subscribe(() => onStoreChange())
            return () => subscription.unsubscribe()
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
