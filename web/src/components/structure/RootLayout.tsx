import { Outlet, useRouterState } from "@tanstack/react-router"

import PanelsLayout from "@/components/structure/PanelsLayout"
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
                    <PanelsLayout>
                        <Outlet />
                    </PanelsLayout>
                )}
            </Wiring>
        </ToastLayout>
    )
}
