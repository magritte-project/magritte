import { Outlet, useRouterState } from "@tanstack/react-router"

import PageHeader from "@/components/chrome/PageHeader"
import PlayerFooter from "@/components/chrome/PlayerFooter"
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
                        <PageHeader />
                        <Outlet />
                        {!hideTransportControls && <PlayerFooter />}
                    </ExtensionPanelLayout>
                )}
                {/*<PlayerOverlay />*/}
            </Wiring>
        </NotificationCenterLayout>
    )
}
