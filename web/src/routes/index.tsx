import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    beforeLoad: async ({ context: { userSession } }) => {
        if (userSession.isSignedIn) {
            throw redirect({ to: "/libraries" })
        } else {
            throw redirect({ to: "/sign-in" })
        }
    },
})
