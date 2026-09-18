import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

import useLastfm from "@/hooks/lastfmHook"
import {
    AuthorizationCancelled,
    beginAuthorization,
    type AuthorizationHandle,
} from "@/lastfm/authentication"

export interface UseAuthenticationResult {
    /** Whether sign in is waiting on Last.fm or on the user */
    readonly isBusy: boolean

    /**
     * The page the user has to approve the extension on, while that is
     * outstanding. Offered as a link because browsers block windows opened
     * from a frame in some configurations.
     */
    readonly authorizationUrl: string | null

    /** Whether the browser blocked the window which would have been opened */
    readonly wasWindowBlocked: boolean

    /** Whatever went wrong with the last attempt, if anything */
    readonly error: unknown

    signIn(): Promise<void>
    signOut(): void
    cancel(): void
}

export default function useAuthentication(): UseAuthenticationResult {
    const { client, account } = useLastfm()
    const queryClient = useQueryClient()
    const [isBusy, setIsBusy] = useState(false)
    const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null)
    const [wasWindowBlocked, setWasWindowBlocked] = useState(false)
    const [error, setError] = useState<unknown>(null)
    const handle = useRef<AuthorizationHandle | null>(null)

    // An attempt outlives this hook's view, so do not leave a window open behind it
    useEffect(() => () => handle.current?.cancel(), [])

    const signIn = useCallback(async () => {
        setError(null)
        setIsBusy(true)
        try {
            const pending = await beginAuthorization(client, account)
            handle.current = pending
            setAuthorizationUrl(pending.authorizationUrl)
            setWasWindowBlocked(pending.wasWindowBlocked)
            await pending.session
            // Everything on screen belongs to whoever was signed in before
            queryClient.clear()
        } catch (caught) {
            if (!(caught instanceof AuthorizationCancelled)) {
                console.error("*** Could not sign in to Last.fm", caught)
                setError(caught)
            }
        } finally {
            handle.current = null
            setAuthorizationUrl(null)
            setWasWindowBlocked(false)
            setIsBusy(false)
        }
    }, [client, account, queryClient])

    const signOut = useCallback(() => {
        account.signOut()
        queryClient.clear()
    }, [account, queryClient])

    const cancel = useCallback(() => {
        handle.current?.cancel()
    }, [])

    return { isBusy, authorizationUrl, wasWindowBlocked, error, signIn, signOut, cancel }
}
