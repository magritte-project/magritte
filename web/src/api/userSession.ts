export interface UserSession {
    readonly accessToken: string
}

export class UserSessionManager {
    constructor() {
        this._eventTarget = new EventTarget()
    }

    readonly _eventTarget: EventTarget

    get current(): UserSession | null {
        throw new Error("Unimplemented")
    }

    set current(_userSession: UserSession | null) {
        throw new Error("Unimplemented")
    }

    get isSignedIn(): boolean {
        return this.current !== null
    }

    dispatchUserSessionChangeEvent() {
        this._eventTarget.dispatchEvent(new CustomEvent("onUserSessionChange"))
    }

    addUserSessionChangeEventListener(
        callback: EventListenerOrEventListenerObject,
    ) {
        this._eventTarget.addEventListener("onUserSessionChange", callback)
    }

    removeUserSessionChangeEventListener(
        callback: EventListenerOrEventListenerObject,
    ) {
        this._eventTarget.removeEventListener("onUserSessionChange", callback)
    }
}

export class StorageUserSessionManager extends UserSessionManager {
    static readonly local = new StorageUserSessionManager(localStorage)

    constructor(storage: Storage) {
        super()
        this._storage = storage
    }

    readonly _storage: Storage

    override get current(): UserSession | null {
        const accessToken = this._storage.getItem("userSession.accessToken")
        if (accessToken === null) {
            return null
        }
        return {
            accessToken,
        }
    }

    override set current(userSession: UserSession | null) {
        if (userSession != null) {
            this._storage.setItem(
                "userSession.accessToken",
                userSession.accessToken,
            )
        } else {
            this._storage.removeItem("userSession.accessToken")
        }
        this.dispatchUserSessionChangeEvent()
    }
}
