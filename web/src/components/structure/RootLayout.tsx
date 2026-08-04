import { Outlet, useRouterState } from "@tanstack/react-router"

import TransportControls from "@/components/chrome/TransportControls"
import ExtensionPanelLayout from "@/components/extensions/ExtensionPanelLayout"
import ToastLayout from "@/components/structure/ToastLayout"
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
        <ToastLayout>
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
        </ToastLayout>
    )
}
