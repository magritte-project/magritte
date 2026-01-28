import { Outlet, useRouterState } from "@tanstack/react-router"

import Splits from "@/components/structure/Splits"
import ToastLayout from "@/components/structure/ToastLayout"
import Wiring from "@/components/structure/Wiring"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) => matches.some((match) => match.staticData?.hideSplit === true),
    })
    return (
        <ToastLayout>
            <Wiring>
                <Splits hideSplit={hideSplit}>
                    <Outlet />
                </Splits>
            </Wiring>
        </ToastLayout>
    )
}
