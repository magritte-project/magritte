const events = new EventTarget()

export interface UserSession {
    readonly accessToken: string
}

export function retrieveUserSession(): UserSession | null {
    const accessToken = localStorage.getItem("userSession.accessToken")
    if (accessToken === null) {
        return null
    }
    return {
        accessToken,
    }
}

export function storeUserSession(userSession: UserSession | null) {
    if (userSession != null) {
        localStorage.setItem("userSession.accessToken", userSession.accessToken)
    } else {
        localStorage.removeItem("userSession.accessToken")
    }
    events.dispatchEvent(new CustomEvent("onUserSessionChange"))
}

export function addUserSessionChangeEventListener(
    callback: EventListenerOrEventListenerObject,
) {
    events.addEventListener("onUserSessionChange", callback)
}

export function removeUserSessionChangeEventListener(
    callback: EventListenerOrEventListenerObject,
) {
    events.removeEventListener("onUserSessionChange", callback)
}
