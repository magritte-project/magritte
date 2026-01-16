import { Outlet, useRouterState } from "@tanstack/react-router"

import SplitsContextProvider from "@/contexts/providers/SplitsContextProvider"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) => matches.some((match) => match.staticData?.hideSplit === true),
    })
    return (
        <SplitsContextProvider hideSplit={hideSplit}>
            <Outlet />
        </SplitsContextProvider>
    )
}
