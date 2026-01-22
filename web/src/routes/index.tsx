import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
    beforeLoad: async ({ context: { userSession, apiClient } }) => {
        if (userSession.isSignedIn) {
            throw redirect({ to: "/libraries" })
        } else {
            const firstSetupComplete = await (async () => {
                try {
                    const instanceStatus = await apiClient.instanceStatus()
                    return instanceStatus.first_setup_complete
                } catch (error) {
                    console.error("Error fetching instance status:", error)
                    return true
                }
            })()
            if (firstSetupComplete) {
                throw redirect({ to: "/sign-in" })
            } else {
                throw redirect({ to: "/sign-up" })
            }
        }
    },
})
