import type { APIClient } from "@/api/client"
import type { UserSessionManager, UserSessionManagerEvent } from "@/api/userSession"

import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

type UserEventsState =
    | { type: "notConnected" }
    | { type: "connecting" }
    | { type: "connected"; websocket: WebSocket }

export type UserEvent = {
    event_type: "notifications_changed" | "libraries_changed"
    ids: readonly number[]
}

export class UserEvents {
    private readonly _events: EventSink<UserEvent>
    private _state: UserEventsState

    constructor(
        private readonly apiClient: APIClient,
        private readonly userSession: UserSessionManager,
    ) {
        ;[this._events, this.$events] = createEvent<UserEvent>()
        this._state = { type: "notConnected" }

        userSession.$events.subscribe((event) => this._onUserSessionManagerEvent(event))
        this._syncWithUserSession()
    }

    readonly $events: EventStream<UserEvent>

    private _onUserSessionManagerEvent(event: UserSessionManagerEvent) {
        switch (event.type) {
            case "currentDidChange":
                this._syncWithUserSession()
                break
            default:
                break
        }
    }

    async _syncWithUserSession() {
        if (this.userSession.current !== null) {
            if (this._state.type !== "notConnected") {
                this._disconnect()
            }
            await this._connect()
        } else {
            if (this._state.type !== "notConnected") {
                this._disconnect()
            }
        }
    }

    async _connect() {
        this._state = { type: "connecting" }
        const { token } = await this.apiClient.streamUserEventsPreflight()
        const websocket = new WebSocket(
            `${import.meta.env.VITE_API_URL}/users/events?token=${encodeURIComponent(token)}`,
        )
        websocket.addEventListener("open", (event) => this._onOpen(websocket, event))
        websocket.addEventListener("error", (event) => this._onError(websocket, event))
        websocket.addEventListener("message", (event) => this._onMessage(websocket, event))
        websocket.addEventListener("close", (event) => this._onClose(websocket, event))
        console.debug("UserEvents connecting")
    }

    _disconnect() {
        if (this._state.type === "connected") {
            this._state.websocket.close()
        }
    }

    private _onOpen(websocket: WebSocket, event: Event) {
        if (this._state.type !== "connecting") {
            return
        }
        console.debug("UserEvents connected", event)
        this._state = { type: "connected", websocket }
    }

    private _onError(websocket: WebSocket, event: Event) {
        if (this._state.type !== "connected" || this._state.websocket !== websocket) {
            return
        }
        console.error("UserEvents error", event)
    }

    private _onMessage(websocket: WebSocket, event: MessageEvent<string>) {
        if (this._state.type !== "connected" || this._state.websocket !== websocket) {
            return
        }
        console.debug("UserEvents message", event.data)
        if (typeof event.data === "string") {
            this._events.dispatch(JSON.parse(event.data))
        }
    }

    private _onClose(websocket: WebSocket, event: CloseEvent) {
        if (this._state.type !== "connected" || this._state.websocket !== websocket) {
            return
        }
        console.debug("UserEvents closed", event)
        this._state = { type: "notConnected" }
    }
}
