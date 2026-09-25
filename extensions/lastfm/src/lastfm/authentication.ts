import type { LastfmAccount } from "@/lastfm/account"
import {
    LastfmError,
    LastfmErrorCode,
    type LastfmClient,
    type LastfmSession,
} from "@/lastfm/client"

/** How often the approved token is checked for, in milliseconds */
const POLL_INTERVAL = 2_000

/** How long to wait for the user to approve the token, in milliseconds */
const TIMEOUT = 5 * 60 * 1000

export class AuthorizationCancelled extends Error {
    constructor() {
        super("Sign in was cancelled")
        this.name = "AuthorizationCancelled"
    }
}

export interface AuthorizationHandle {
    /** The Last.fm page the user approves the extension on */
    readonly authorizationUrl: string

    /** Whether the browser blocked the window this would have opened */
    readonly wasWindowBlocked: boolean

    /** Resolves with the session once the user has approved the extension */
    readonly session: Promise<LastfmSession>

    /** Give up waiting for the user */
    cancel(): void
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Start signing in to Last.fm.
 *
 * Last.fm has no callback-free web flow, and a callback would have to be
 * registered against the API account, which every instance of Magritte
 * configures for itself. So this uses the desktop flow instead: request a
 * token, send the user to approve it, and poll until they have.
 *
 * The returned handle resolves once the user approves, and carries the URL
 * so the UI can offer a link when the browser blocks the window.
 */
export async function beginAuthorization(
    client: LastfmClient,
    account: LastfmAccount,
): Promise<AuthorizationHandle> {
    const token = await client.getToken()
    const authorizationUrl = client.getAuthorizationUrl(token)
    const approvalWindow = globalThis.open(
        authorizationUrl,
        "magritte-lastfm-authorize",
        "popup,width=520,height=720",
    )

    let isCancelled = false
    const session = (async () => {
        const deadline = Date.now() + TIMEOUT
        while (Date.now() < deadline) {
            await delay(POLL_INTERVAL)
            if (isCancelled) {
                throw new AuthorizationCancelled()
            }
            try {
                const session = await client.getSession(token)
                account.signIn(session)
                approvalWindow?.close()
                return session
            } catch (error) {
                // Anything but "not approved yet" means this attempt is over
                if (
                    !(error instanceof LastfmError) ||
                    error.code !== LastfmErrorCode.unauthorizedToken
                ) {
                    approvalWindow?.close()
                    throw error
                }
            }
            // A closed window means the user walked away rather than approving
            if (approvalWindow?.closed) {
                throw new AuthorizationCancelled()
            }
        }
        approvalWindow?.close()
        throw new Error("Timed out waiting for Last.fm to be authorized")
    })()

    return {
        authorizationUrl,
        wasWindowBlocked: approvalWindow === null,
        session,
        cancel: () => {
            isCancelled = true
            approvalWindow?.close()
        },
    }
}
