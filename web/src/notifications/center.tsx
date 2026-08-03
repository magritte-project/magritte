import type { API, NotificationRead, NotificationsRead, UserEvent } from "@magritte/api"
import type { ToastOptions } from "@magritte/sdk"
import { QueryObserver, type QueryClient, type QueryObserverResult } from "@tanstack/react-query"

import { userMeNotification, userMeNotifications } from "@/api/keys/users"
import { readNotifications } from "@/api/queries/users"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

export type NotificationCenterEvent =
    | { type: "serverNotificationsDidChange" }
    | { type: "toastDidChange" }

export class NotificationCenter {
    private readonly _events: EventSink<NotificationCenterEvent>
    private readonly _queryClient: QueryClient
    private _serverNotifications: readonly NotificationRead[]
    private _toasts: readonly ToastOptions[]
    private _toastTimeoutId: ReturnType<typeof setTimeout> | null

    constructor(queryClient: QueryClient, api: API) {
        ;[this._events, this.$events] = createEvent()
        this._queryClient = queryClient
        this._serverNotifications = []
        this._toasts = []
        this._toastTimeoutId = null

        api.userEventsManager.subscribe((event) => this._handleUserEvent(event))

        const observer = new QueryObserver(queryClient, readNotifications(api.client))
        observer.subscribe((result) => this._handleReadNotificationsQueryResult(result))
        queryClient.ensureQueryData(readNotifications(api.client))
    }

    private async _handleUserEvent(event: UserEvent) {
        switch (event.event_type) {
            case "notifications_changed":
                await this._queryClient.invalidateQueries({
                    queryKey: userMeNotifications(),
                    exact: false,
                })
                for (const notificationId of event.ids) {
                    await this._queryClient.invalidateQueries({
                        queryKey: userMeNotification(notificationId),
                    })
                }
                break
        }
    }

    private async _handleReadNotificationsQueryResult(
        result: QueryObserverResult<NotificationsRead, Error>,
    ) {
        if (result.isSuccess) {
            this._serverNotifications = result.data.items
            this._events.dispatch({ type: "serverNotificationsDidChange" })
        } else if (result.isError) {
            this.showToast({
                message: `Could not read notifications: ${result.error.message}`,
                type: "error",
            })
        }
    }

    readonly $events: EventStream<NotificationCenterEvent>

    get serverNotifications(): readonly NotificationRead[] {
        return this._serverNotifications
    }

    private _dismissToastLater(): void {
        this._toastTimeoutId = setTimeout(() => {
            this.dismissToast()
            if (this._toasts.length > 0) {
                this._dismissToastLater()
            }
        }, 3000)
    }

    showToast(options: ToastOptions): void {
        this._toasts = [...this._toasts, options]
        if (this._toasts.length === 1) {
            this._dismissToastLater()
            this._events.dispatch({ type: "toastDidChange" })
        }
    }

    dismissToast(): void {
        if (this._toasts.length > 0) {
            this._toasts = this._toasts.slice(1)
            this._events.dispatch({ type: "toastDidChange" })
        }
        if (this._toastTimeoutId !== null) {
            clearTimeout(this._toastTimeoutId)
            this._toastTimeoutId = null
        }
    }

    get toast(): ToastOptions | null {
        if (this._toasts.length > 0) {
            return this._toasts[0]
        } else {
            return null
        }
    }
}
