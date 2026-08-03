import { Outlet, useRouterState } from "@tanstack/react-router"

import ExtensionPanelLayout from "@/components/extensions/ExtensionPanelLayout"
import ToastLayout from "@/components/structure/ToastLayout"
import Wiring from "@/components/structure/Wiring"

export default function RootLayout() {
    const wantsFullPageLayout = useRouterState({
        select: ({ matches }) =>
            matches.some((match) => match.staticData?.wantsFullPageLayout === true),
    })
    return (
        <ToastLayout>
            <Wiring>
                {wantsFullPageLayout ? (
                    <Outlet />
                ) : (
                    <ExtensionPanelLayout>
                        <Outlet />
                    </ExtensionPanelLayout>
                )}
            </Wiring>
        </ToastLayout>
    )
}
