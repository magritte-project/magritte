import type { API, NotificationRead, NotificationsRead, UserEvent } from "@magritte/api"
import { DialogButtonID, type DialogOptions, type ToastOptions } from "@magritte/sdk"
import { QueryObserver, type QueryClient, type QueryObserverResult } from "@tanstack/react-query"
import { secondsToMilliseconds } from "motion/react"

import { userMeNotification, userMeNotifications } from "@/api/keys/users"
import { readNotifications } from "@/api/queries/users"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"
import { promiseResolver, type PromiseResolver } from "@/utilities/promises"

export type NotificationCenterEvent =
    | { type: "serverNotificationsDidChange" }
    | { type: "toastDidChange" }
    | { type: "dialogDidChange" }

type SeenNotifications = { status: "unloaded" } | { status: "loaded"; ids: Set<number> }

export type NotificationCenterConfirmOptions = Omit<DialogOptions, "type" | "buttons"> & {
    destructive?: boolean
    confirmButtonLabel?: string
}

export class NotificationCenter {
    private readonly _events: EventSink<NotificationCenterEvent>
    private readonly _queryClient: QueryClient
    private _seenNotifications: SeenNotifications
    private _serverNotifications: readonly NotificationRead[]
    private _toasts: readonly ToastOptions[]
    private _toastTimeoutId: ReturnType<typeof setTimeout> | null
    private _dialogs: readonly [
        DialogOptions,
        PromiseResolver<number>,
        ReturnType<typeof setTimeout>,
    ][]

    constructor(queryClient: QueryClient, api: API) {
        ;[this._events, this.$events] = createEvent()
        this._queryClient = queryClient
        this._seenNotifications = { status: "unloaded" }
        this._serverNotifications = []
        this._toasts = []
        this._toastTimeoutId = null
        this._dialogs = []

        api.userEventsManager.subscribe((event) => this._handleUserEvent(event))

        const observer = new QueryObserver(queryClient, readNotifications(api))
        observer.subscribe((result) => this._handleReadNotificationsQueryResult(result))
        queryClient.ensureQueryData(readNotifications(api))
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
            this._events({ type: "serverNotificationsDidChange" })

            switch (this._seenNotifications.status) {
                case "unloaded":
                    this._seenNotifications = {
                        status: "loaded",
                        ids: new Set(result.data.items.map((notification) => notification.id)),
                    }
                    break
                case "loaded":
                    const seenNotificationIds = this._seenNotifications.ids
                    const unseen = result.data.items.filter(
                        (notification) =>
                            !seenNotificationIds.has(notification.id) && !notification.is_read,
                    )
                    for (const notification of unseen) {
                        this.showToast({ message: notification.title, type: "info" })
                        seenNotificationIds.add(notification.id)
                    }
                    break
            }
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
            this._events({ type: "toastDidChange" })
        }
    }

    dismissToast(): void {
        if (this._toasts.length > 0) {
            this._toasts = this._toasts.slice(1)
            this._events({ type: "toastDidChange" })
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

    showDialog(options: DialogOptions): Promise<number> {
        if (options.buttons && options.buttons.length === 0) {
            return Promise.reject(new Error("Dialog must have at least one button"))
        }
        const resolver = promiseResolver<number>()
        const timeoutId = setTimeout(
            () => this.dismissDialog(DialogButtonID.cancel),
            options.timeout ?? secondsToMilliseconds(60),
        )
        this._dialogs = [...this._dialogs, [options, resolver, timeoutId]]
        this._events({ type: "dialogDidChange" })
        return resolver.promise
    }

    dismissDialog(buttonId?: number): void {
        if (this._dialogs.length > 0) {
            const [dialog, { resolve, reject }] = this._dialogs[0]
            if (buttonId === undefined) {
                if (dialog.buttons?.length === 1) {
                    buttonId = dialog.buttons[0].id
                } else {
                    buttonId = DialogButtonID.cancel
                }
            }
            if (dialog.buttons && !dialog.buttons.some((button) => button.id === buttonId)) {
                reject(new Error(`Dialog does not have button with id: ${buttonId}`))
            } else {
                resolve(buttonId)
            }
            this._dialogs = this._dialogs.slice(1)
            this._events({ type: "dialogDidChange" })
        }
    }

    get dialog(): DialogOptions | null {
        if (this._dialogs.length > 0) {
            const [dialog] = this._dialogs[0]
            return dialog
        } else {
            return null
        }
    }

    async confirm({
        destructive = false,
        confirmButtonLabel = "OK",
        ...options
    }: NotificationCenterConfirmOptions): Promise<boolean> {
        const result = await this.showDialog({
            ...options,
            type: "info",
            buttons: [
                { id: DialogButtonID.cancel, label: "Cancel", role: "secondary" },
                {
                    id: DialogButtonID.ok,
                    label: confirmButtonLabel,
                    role: destructive ? "destructive" : "primary",
                },
            ],
        })
        return result === DialogButtonID.ok
    }
}
