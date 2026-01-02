import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouteContext } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import type { Token } from "@/api/openapi"
import type { UserSession } from "@/api/userSession"

export interface UseUserSessionResult {
    readonly current: UserSession | null
    readonly isSignedIn: boolean
    readonly signIn: (token: Token) => Promise<void>
    readonly signOut: () => Promise<void>
}

export default function useUserSession(): UseUserSessionResult {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const context = useRouteContext({
        strict: false,
    })
    // biome-ignore lint/style/noNonNullAssertion: userSession is set at root level
    const userSession = context.userSession!
    const [current, setCurrent] = useState(() => userSession.current)
    const isSignedIn = current !== null
    useEffect(() => {
        const handleUserSessionChangeEventListener = async () => {
            setCurrent(userSession.current)
            queryClient.invalidateQueries()
        }
        userSession.addUserSessionChangeEventListener(handleUserSessionChangeEventListener)
        return () => {
            userSession.removeUserSessionChangeEventListener(handleUserSessionChangeEventListener)
        }
    }, [userSession, queryClient])
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
        navigate({ to: "/" })
    }, [navigate, userSession])

    return { current: current, isSignedIn, signIn, signOut }
}
