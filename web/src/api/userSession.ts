import { createEvent, EventStream, type EventSink } from "@magritte/sdk"

import type { OAuth2Scope } from "@/api/openapi"

export interface UserSession {
    readonly accessToken: string
    readonly scopes: readonly OAuth2Scope[]
}

export type UserSessionManagerEvent = { type: "currentDidChange"; current: UserSession | null }

export class UserSessionManager {
    private readonly _events: EventSink<UserSessionManagerEvent>

    constructor() {
        ;[this._events, this.$events] = createEvent<UserSessionManagerEvent>()
    }

    readonly $events: EventStream<UserSessionManagerEvent>

    get current(): UserSession | null {
        throw new Error("Unimplemented")
    }

    set current(_userSession: UserSession | null) {
        throw new Error("Unimplemented")
    }

    get isSignedIn(): boolean {
        return this.current !== null
    }

    hasScope(scope: OAuth2Scope): boolean {
        const current = this.current
        return current !== null && current.scopes.includes(scope)
    }

    _dispatchCurrentDidChange() {
        this._events.dispatch({ type: "currentDidChange", current: this.current })
    }
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

function storeUserSession(storage: Storage, userSession: UserSession | null): UserSession | null {
    if (userSession != null) {
        storage.setItem("userSession.accessToken", userSession.accessToken)
        storage.setItem("userSession.scope", userSession.scopes.join(" "))
    } else {
        storage.removeItem("userSession.accessToken")
        storage.removeItem("userSession.scope")
    }
    return userSession
}

export class StorageUserSessionManager extends UserSessionManager {
    static readonly local = new StorageUserSessionManager(localStorage)

    constructor(storage: Storage) {
        super()
        this._storage = storage
        this._current = retrieveUserSession(storage)
    }

    readonly _storage: Storage
    private _current: UserSession | null

    override get current(): UserSession | null {
        return this._current
    }

    override set current(userSession: UserSession | null) {
        this._current = storeUserSession(this._storage, userSession)
        this._dispatchCurrentDidChange()
    }
}
