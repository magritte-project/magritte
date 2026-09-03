import { Outlet, useRouterState } from "@tanstack/react-router"

import TransportControls from "@/components/chrome/TransportControls"
import ExtensionPanelLayout from "@/components/extensions/ExtensionPanelLayout"
import NotificationCenterLayout from "@/components/structure/NotificationCenterLayout"
import Wiring from "@/components/structure/Wiring"

export default function RootLayout() {
    const [wantsFullPageLayout, hideTransportControls] = useRouterState({
        select: ({ matches }) =>
            [
                matches.some((match) => match.staticData?.wantsFullPageLayout === true),
                matches.some((match) => match.staticData?.hideTransportControls === true),
            ] as const,
    })
    return (
        <NotificationCenterLayout>
            <Wiring>
                {wantsFullPageLayout ? (
                    <Outlet />
                ) : (
                    <ExtensionPanelLayout>
                        <Outlet />
                        {!hideTransportControls && <TransportControls />}
                    </ExtensionPanelLayout>
                )}
            </Wiring>
        </NotificationCenterLayout>
    )
}
