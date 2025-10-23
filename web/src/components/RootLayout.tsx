import SideBar from "@/components/SideBar"
import { Outlet, useRouterState } from "@tanstack/react-router"

export default function RootLayout() {
    const hideSplit = useRouterState({
        select: ({ matches }) =>
            matches.some((match) => match.staticData?.hideSplit === true),
    })
    return hideSplit ? (
        <Outlet />
    ) : (
        <div>
            <div className="pr-64">
                <Outlet />
            </div>
            <div className="fixed right-0 top-0 bottom-0 overflow-auto border-l border-gray-300 w-64">
                <SideBar />
            </div>
        </div>
    )
}
