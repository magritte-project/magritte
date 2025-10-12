import type { Token } from "@/api/openapi"
import {
    type UserSession,
    addUserSessionChangeEventListener,
    removeUserSessionChangeEventListener,
    retrieveUserSession,
    storeUserSession,
} from "@/api/userSession"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"

export interface UseUserSessionResult {
    readonly userSession: UserSession | null
    readonly isSignedIn: boolean
    readonly signIn: (token: Token) => Promise<void>
    readonly signOut: () => Promise<void>
}

export default function useUserSession(): UseUserSessionResult {
    const queryClient = useQueryClient()
    const [userSession, setUserSession] = useState(() => retrieveUserSession())
    const isSignedIn = userSession !== null
    useEffect(() => {
        const handleUserSessionChangeEventListener = async () => {
            setUserSession(retrieveUserSession())
            queryClient.invalidateQueries()
        }
        addUserSessionChangeEventListener(handleUserSessionChangeEventListener)
        return () => {
            removeUserSessionChangeEventListener(
                handleUserSessionChangeEventListener,
            )
        }
    }, [queryClient])
    const signIn = useCallback(async (token: Token) => {
        storeUserSession({ accessToken: token.access_token })
    }, [])
    const signOut = useCallback(async () => {
        storeUserSession(null)
    }, [])

    return { userSession, isSignedIn, signIn, signOut }
}
