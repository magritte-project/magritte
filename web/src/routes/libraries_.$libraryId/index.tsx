import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId/")({
    beforeLoad: async ({ params }) => {
        throw redirect({ to: "/libraries/$libraryId/songs", params })
    },
})
