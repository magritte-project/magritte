import { $oneWayMap, $state, type Property, type ReadonlyProperty } from "@magritte/sdk"

import type { OAuth2Scope } from "@/api/openapi"

export interface UserSession {
    readonly accessToken: string
    readonly scopes: readonly OAuth2Scope[]
}

export interface UserSessionManager {
    readonly $current: Property<UserSession | null>
    current: UserSession | null

    readonly $isSignedIn: ReadonlyProperty<boolean>
    readonly isSignedIn: boolean

    hasScope(scope: OAuth2Scope): boolean
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
    static readonly local = new StorageUserSessionManager(localStorage)

    constructor(storage: Storage) {
        this.$current = $state(retrieveUserSession(storage))
        this.$isSignedIn = $oneWayMap(this.$current, (current) => current != null)
        this.$current.subscribe((current) => {
            storeUserSession(storage, current)
        })
    }

    readonly $current: Property<UserSession | null>

    get current(): UserSession | null {
        return this.$current.wrappedValue
    }

    set current(userSession: UserSession | null) {
        this.$current.wrappedValue = userSession
    }

    readonly $isSignedIn: ReadonlyProperty<boolean>

    get isSignedIn(): boolean {
        return this.$isSignedIn.wrappedValue
    }

    hasScope(scope: OAuth2Scope): boolean {
        const current = this.current
        return current !== null && current.scopes.includes(scope)
    }
}
