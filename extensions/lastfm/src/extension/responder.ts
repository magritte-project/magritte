import type {
    CommandContext,
    CommandPresentation,
    CommandResponder,
    NotificationCenter,
} from "@magritte/sdk"

import type { LastfmAccount } from "@/lastfm/account"
import { AuthorizationCancelled, beginAuthorization } from "@/lastfm/authentication"
import type { LastfmClient } from "@/lastfm/client"

export interface LastfmCommandResponderOptions {
    readonly client: LastfmClient
    readonly account: LastfmAccount

    /**
     * Resolves the host's notification center.
     *
     * Deferred because the responder has to exist before the connection
     * carrying the notification center does.
     */
    getNotificationCenter(): Promise<NotificationCenter>
}

export default class LastfmCommandResponder implements CommandResponder {
    private readonly _client: LastfmClient
    private readonly _account: LastfmAccount
    private readonly _getNotificationCenter: () => Promise<NotificationCenter>

    constructor({ client, account, getNotificationCenter }: LastfmCommandResponderOptions) {
        this._client = client
        this._account = account
        this._getNotificationCenter = getNotificationCenter
    }

    private async _showToast(type: "info" | "warning" | "error", message: string) {
        const notificationCenter = await this._getNotificationCenter()
        await notificationCenter.showToast({ type, message })
    }

    async presentCommand({ id }: CommandContext): Promise<CommandPresentation> {
        switch (id) {
            case "account.authenticate":
                return {
                    displayName: this._account.isSignedIn
                        ? "Sign Out of Last.fm"
                        : "Sign In to Last.fm",
                    disabled: !this._client.hasCredentials,
                }
            case "scrobbling.toggle":
                return {
                    displayName: this._account.isScrobblingEnabled
                        ? "Pause Last.fm Scrobbling"
                        : "Resume Last.fm Scrobbling",
                    disabled: !this._account.isSignedIn,
                }
            default:
                throw new Error(`Unknown command: ${id}`)
        }
    }

    async executeCommand({ id }: CommandContext): Promise<void> {
        switch (id) {
            case "account.authenticate":
                await this._authenticate()
                break
            case "scrobbling.toggle": {
                const isScrobblingEnabled = !this._account.isScrobblingEnabled
                this._account.setScrobblingEnabled(isScrobblingEnabled)
                await this._showToast(
                    "info",
                    isScrobblingEnabled
                        ? "Scrobbling to Last.fm resumed"
                        : "Scrobbling to Last.fm paused",
                )
                break
            }
            default:
                throw new Error(`Unknown command: ${id}`)
        }
    }

    private async _authenticate() {
        if (this._account.isSignedIn) {
            this._account.signOut()
            await this._showToast("info", "Signed out of Last.fm")
            return
        }
        try {
            const authorization = await beginAuthorization(this._client, this._account)
            if (authorization.wasWindowBlocked) {
                // The command palette's click happened in the host, not in this
                // frame, so a browser may refuse to open the approval window
                authorization.cancel()
                await this._showToast("warning", "Open the Last.fm extension to sign in")
                return
            }
            await this._showToast("info", "Approve Magritte in the Last.fm window that just opened")
            const session = await authorization.session
            await this._showToast("info", `Signed in to Last.fm as ${session.name}`)
        } catch (error) {
            if (error instanceof AuthorizationCancelled) {
                return
            }
            console.error("*** Could not sign in to Last.fm", error)
            await this._showToast(
                "error",
                error instanceof Error ? error.message : "Could not sign in to Last.fm",
            )
        }
    }
}
