import { Outlet, useRouterState } from "@tanstack/react-router"

import ToastLayout from "@/components/ToastLayout"
import SplitsContextProvider from "@/contexts/providers/SplitsContextProvider"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) => matches.some((match) => match.staticData?.hideSplit === true),
    })
    return (
        <ToastLayout>
            <SplitsContextProvider hideSplit={hideSplit}>
                <Outlet />
            </SplitsContextProvider>
        </ToastLayout>
    )
}
