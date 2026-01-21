import { Outlet, useRouterState } from "@tanstack/react-router"

import Splits from "@/components/structure/Splits"
import ToastLayout from "@/components/structure/ToastLayout"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) => matches.some((match) => match.staticData?.hideSplit === true),
    })
    return (
        <ToastLayout>
            <Splits hideSplit={hideSplit}>
                <Outlet />
            </Splits>
        </ToastLayout>
    )
}
