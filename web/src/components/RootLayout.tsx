import { Outlet, useRouterState } from "@tanstack/react-router"
import SideBarLayout from "@/components/SideBarLayout"
import Split from "@uiw/react-split"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) =>
            matches.some((match) => match.staticData?.hideSplit === true),
    })
    return hideSplit ? (
        <Outlet />
    ) : (
        <Split mode="horizontal" lineBar className="min-h-screen">
            <div className="flex-1">
                <Outlet />
            </div>
            <div className="min-w-64 w-64">
                <SideBarLayout />
            </div>
        </Split>
    )
}
