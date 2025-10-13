import { retrieveUserSession } from "@/api/userSession"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    beforeLoad: async () => {
        if (retrieveUserSession() !== null) {
            throw redirect({ to: "/libraries" })
        } else {
            throw redirect({ to: "/sign-in" })
        }
    },
})
