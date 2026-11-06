import { Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect } from "react"

import PageFooter from "@/components/chrome/PageFooter"
import PageHeader from "@/components/chrome/PageHeader"
import ExtensionPanelLayout from "@/components/extensions/ExtensionPanelLayout"
import NotificationCenterLayout from "@/components/structure/NotificationCenterLayout"
import Wiring from "@/components/structure/Wiring"
import useHotKeyDispatcher from "@/hooks/hotKeyDispatcherHook"

export default function RootLayout() {
    const [wantsFullPageLayout, hideTransportControls] = useRouterState({
        select: ({ matches }) =>
            [
                matches.some((match) => match.staticData?.wantsFullPageLayout === true),
                matches.some((match) => match.staticData?.hideTransportControls === true),
            ] as const,
    })

    const hotKeyDispatcher = useHotKeyDispatcher()
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const handled = hotKeyDispatcher.dispatch(event)
            if (handled) {
                event.stopPropagation()
                event.preventDefault()
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [hotKeyDispatcher])

    return (
        <NotificationCenterLayout>
            <Wiring>
                {wantsFullPageLayout ? (
                    <Outlet />
                ) : (
                    <ExtensionPanelLayout>
                        <PageHeader />
                        <Outlet />
                        {!hideTransportControls && <PageFooter />}
                    </ExtensionPanelLayout>
                )}
            </Wiring>
        </NotificationCenterLayout>
    )
}
