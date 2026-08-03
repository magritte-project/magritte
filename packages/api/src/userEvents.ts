import type { APIClient } from "@magritte/api"
import type { UserSessionManager } from "@magritte/api"

type UserEventsState =
    | { type: "notConnected" }
    | { type: "connecting" }
    | { type: "connected"; websocket: WebSocket }

export type UserEvent = {
    event_type: "notifications_changed" | "libraries_changed"
    ids: readonly number[]
}

export class UserEventsManager {
    private readonly subscribers: ((userEvent: UserEvent) => void)[]
    private state: UserEventsState

    constructor(
        private readonly baseUrl: string,
        private readonly client: APIClient,
        private readonly userSessionManager: UserSessionManager,
    ) {
        this.subscribers = []
        this.state = { type: "notConnected" }

        userSessionManager.addEventListener("usersessionchanged", () => this._syncWithUserSession())
        this._syncWithUserSession()
    }

    async _syncWithUserSession() {
        if (this.userSessionManager.current !== null) {
            if (this.state.type !== "notConnected") {
                this._disconnect()
            }
            await this._connect()
        } else {
            if (this.state.type !== "notConnected") {
                this._disconnect()
            }
        }
    }

    async _connect() {
        this.state = { type: "connecting" }
        const { token } = await this.client.streamUserEventsPreflight()
        const websocket = new WebSocket(
            `${this.baseUrl}/users/events?token=${encodeURIComponent(token)}`,
        )
        websocket.addEventListener("open", (event) => this._onOpen(websocket, event))
        websocket.addEventListener("error", (event) => this._onError(websocket, event))
        websocket.addEventListener("message", (event) => this._onMessage(websocket, event))
        websocket.addEventListener("close", (event) => this._onClose(websocket, event))
        console.debug("UserEvents connecting")
    }

    _disconnect() {
        if (this.state.type === "connected") {
            this.state.websocket.close()
        }
    }

    private _onOpen(websocket: WebSocket, event: Event) {
        if (this.state.type !== "connecting") {
            return
        }
        console.debug("UserEvents connected", event)
        this.state = { type: "connected", websocket }
    }

    private _onError(websocket: WebSocket, event: Event) {
        if (this.state.type !== "connected" || this.state.websocket !== websocket) {
            return
        }
        console.error("UserEvents error", event)
    }

    private _onMessage(websocket: WebSocket, event: MessageEvent<string>) {
        if (this.state.type !== "connected" || this.state.websocket !== websocket) {
            return
        }
        console.debug("UserEvents message", event.data)
        if (typeof event.data === "string") {
            const userEvent: UserEvent = JSON.parse(event.data)
            for (const subscriber of this.subscribers) {
                subscriber(userEvent)
            }
        }
    }

    private _onClose(websocket: WebSocket, event: CloseEvent) {
        if (this.state.type !== "connected" || this.state.websocket !== websocket) {
            return
        }
        console.debug("UserEvents closed", event)
        this.state = { type: "notConnected" }
    }

    subscribe(subscriber: (userEvent: UserEvent) => void): () => void {
        this.subscribers.push(subscriber)
        return () => {
            const toRemove = this.subscribers.indexOf(subscriber)
            if (toRemove !== -1) {
                this.subscribers.splice(toRemove, 1)
            }
        }
    }
}
