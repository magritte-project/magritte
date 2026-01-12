import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouteContext, useRouter } from "@tanstack/react-router"
import { useCallback, useSyncExternalStore } from "react"

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
    const context = useRouteContext({
        strict: false,
    })
    // biome-ignore lint/style/noNonNullAssertion: userSession is set at root level
    const userSession = context.userSession!
    const current = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = userSession.$events.subscribe(async (event) => {
                switch (event.type) {
                    case "currentDidChange":
                        if (
                            event.current === null &&
                            !router.state.matches.some((match) => match.staticData.noAuth === true)
                        ) {
                            // NOTE: We must redirect before invalidating the queries
                            //       or we can end up in an infinite loop.
                            setTimeout(() => {
                                navigate({ to: "/sign-in" })
                            }, 16)
                        }
                        onStoreChange()
                        queryClient.clear()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return userSession.current
        },
    )
    const isSignedIn = current !== null

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

    return { current: current, isSignedIn, signIn, signOut }
}
