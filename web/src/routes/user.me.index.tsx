import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/user/me/")({
    beforeLoad: () => {
        throw redirect({ to: "/user/me/extensions", replace: true })
    },
})
