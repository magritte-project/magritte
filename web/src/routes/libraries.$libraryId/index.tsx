import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries/$libraryId/")({
    beforeLoad: async ({ params, matches }) => {
        if (matches[matches.length - 1]?.fullPath === Route.fullPath) {
            throw redirect({ to: "/libraries/$libraryId/songs", params })
        }
    },
})
