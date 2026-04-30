import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/search")({
    component: function SearchRouteComponent() {
        return <Outlet />
    },
})
