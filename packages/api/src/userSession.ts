import type { OAuth2Scope } from "./openapi"

export interface UserSession {
    readonly accessToken: string
    readonly scopes: readonly OAuth2Scope[]
}

export class UserSessionChangedEvent extends Event {
    constructor(eventInit?: EventInit) {
        super("usersessionchanged", eventInit)
    }
}

interface UserSessionManagerEvents {
    usersessionchanged: UserSessionChangedEvent
}

export interface UserSessionManager {
    current: UserSession | null
    readonly isSignedIn: boolean

    hasScope(scope: OAuth2Scope): boolean

    addEventListener<K extends keyof UserSessionManagerEvents>(
        event: K,
        listener: (event: UserSessionManagerEvents[K]) => void,
    ): void
    removeEventListener<K extends keyof UserSessionManagerEvents>(
        event: K,
        listener: (event: UserSessionManagerEvents[K]) => void,
    ): void
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
        this.events = new EventTarget()
        this._current = retrieveUserSession(storage)
    }

    private readonly storage: Storage
    private readonly events: EventTarget
    private _current: UserSession | null

    get current(): UserSession | null {
        return this._current
    }

    set current(userSession: UserSession | null) {
        this._current = userSession
        storeUserSession(this.storage, userSession)
        this.events.dispatchEvent(new UserSessionChangedEvent())
    }

    get isSignedIn(): boolean {
        return this._current !== null
    }

    hasScope(scope: OAuth2Scope): boolean {
        const current = this.current
        return current !== null && current.scopes.includes(scope)
    }

    addEventListener<K extends keyof UserSessionManagerEvents>(
        event: K,
        listener: (event: UserSessionManagerEvents[K]) => void,
    ): void {
        this.events.addEventListener(event, listener)
    }

    removeEventListener<K extends keyof UserSessionManagerEvents>(
        event: K,
        listener: (event: UserSessionManagerEvents[K]) => void,
    ): void {
        this.events.removeEventListener(event, listener)
    }
}
