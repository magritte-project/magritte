import type { APIClient } from "./client"

export interface FileAccessTokenOptions {
    /**
     * Whether to refresh the token even if the current one is valid.
     */
    readonly refresh?: boolean
}

/**
 * Check whether the given token is valid.
 *
 * @param token The token to check.
 * @param expiresAt When the token expires.
 * @returns The token if it's valid, `null` otherwise.
 */
function _checkToken(token: string | null, expiresAt: string | null): string | null {
    if (token === null || expiresAt === null) {
        return null
    }
    if (new Date() > new Date(expiresAt)) {
        return null
    }
    return token
}

/**
 * Helper object which manages a file access token.
 */
export class FileAccess {
    private _token: string | null
    private _expiresAt: string | null
    private _pending: Promise<string> | null

    /**
     * Construct a file access helper.
     *
     * @param client The API client files will be accessed through.
     */
    constructor(private readonly client: APIClient) {
        this._token = null
        this._expiresAt = null
        this._pending = null

        this.token({ refresh: true })
    }

    /**
     * Indicates whether the file access helper has a valid token.
     */
    get hasValidToken(): boolean {
        return _checkToken(this._token, this._expiresAt) !== null
    }

    /**
     * Returns a file access token, fetching one if required.
     *
     * @param options Customizes how the token is handled.
     * @returns A file access token.
     */
    async token(options: FileAccessTokenOptions = {}): Promise<string> {
        if (this._pending) {
            return await this._pending
        }

        const token = _checkToken(this._token, this._expiresAt)
        if (token === null || options.refresh) {
            this._pending = (async () => {
                const preflight = await this.client.readFilesPreflight()
                this._token = preflight.token
                this._expiresAt = preflight.expires_at
                return preflight.token
            })()
            this._pending.finally(() => {
                this._pending = null
            })
            return await this._pending
        } else {
            return token
        }
    }
}
