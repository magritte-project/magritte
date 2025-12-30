import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId/")({
    beforeLoad: async ({ params, location }) => {
        if (location.pathname === Route.fullPath) {
            throw redirect({ to: "/libraries/$libraryId/songs", params })
        }
    },
})
