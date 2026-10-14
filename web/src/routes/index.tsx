import { createFileRoute, redirect } from "@tanstack/react-router"

import { readInstanceStatus } from "@/api/queries/auth"

export const Route = createFileRoute("/")({
    beforeLoad: async ({ context: { api, queryClient } }) => {
        if (api.userSessionManager.isSignedIn) {
            throw redirect({ to: "/libraries" })
        } else {
            const firstSetupComplete = await (async () => {
                try {
                    const instanceStatus = await queryClient.query({
                        ...readInstanceStatus(api),
                        staleTime: "static",
                    })
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
