import type { OAuth2Scope } from "./openapi"

export interface UserSession {
    readonly accessToken: string
    readonly scopes: readonly OAuth2Scope[]
}

export type UserSessionManagerEvent = { type: "currentChanged" }

export interface UserSessionManager {
    readonly session: UserSession | null
    readonly isSignedIn: boolean

    replaceSession(newSession: UserSession | null): void
    hasScope(scope: OAuth2Scope): boolean

    subscribe(subscriber: (event: UserSessionManagerEvent) => void): () => void
}

function retrieveUserSession(storage: Storage): UserSession | null {
    const accessToken = storage.getItem("userSession.accessToken")
    if (accessToken === null) {
        return null
    }
    const scope = storage.getItem("userSession.scope") ?? ""
    const scopes = scope.split(" ") as OAuth2Scope[]
    return {
        accessToken,
        scopes,
    }
}

function storeUserSession(storage: Storage, userSession: UserSession | null) {
    if (userSession != null) {
        storage.setItem("userSession.accessToken", userSession.accessToken)
        storage.setItem("userSession.scope", userSession.scopes.join(" "))
    } else {
        storage.removeItem("userSession.accessToken")
        storage.removeItem("userSession.scope")
    }
}

export class StorageUserSessionManager implements UserSessionManager {
    static readonly local = new StorageUserSessionManager(globalThis.localStorage)

    constructor(storage: Storage) {
        this.storage = storage
        this.subscribers = []
        this._current = retrieveUserSession(storage)
    }

    private readonly storage: Storage
    private readonly subscribers: ((event: UserSessionManagerEvent) => void)[]
    private _current: UserSession | null

    get session(): UserSession | null {
        return this._current
    }

    get isSignedIn(): boolean {
        return this._current !== null
    }

    replaceSession(newSession: UserSession | null) {
        this._current = newSession
        storeUserSession(this.storage, newSession)
        for (const subscriber of this.subscribers.slice()) {
            try {
                subscriber({ type: "currentChanged" })
            } catch (error) {
                console.error(`*** Unhandled error in API client event subscriber`, error)
            }
        }
    }

    hasScope(scope: OAuth2Scope): boolean {
        const current = this.session
        return current !== null && current.scopes.includes(scope)
    }

    subscribe(subscriber: (event: UserSessionManagerEvent) => void): () => void {
        this.subscribers.push(subscriber)
        return () => {
            const toRemove = this.subscribers.indexOf(subscriber)
            if (toRemove !== -1) {
                this.subscribers.splice(toRemove, 1)
            }
        }
    }
}
