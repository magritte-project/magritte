import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import ThemedButton from "@/components/theme/ThemedButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"

export const Route = createFileRoute("/verify/$token")({
    loader: async ({
        context: {
            api: { client },
        },
        params: { token },
    }) => {
        await client.verifyEmail(token)
    },
    component: function VerifyEmailComponent() {
        const navigate = useNavigate()

        const handleDoneClick = useCallback(() => {
            navigate({ to: "/", replace: true })
        }, [navigate])

        return (
            <div className="min-h-screen flex items-center justify-center p-xl">
                <div className="min-w-0 w-100 flex flex-col gap-xl">
                    <header className="flex items-center gap-md">
                        <img src="/icon.svg" alt="Magritte Logo" className="w-8 h-8" />
                        <span className="font-semibold text-xl">Email Verified</span>
                    </header>
                    <p>Your email address has been verified with this Magritte instance.</p>
                    <ThemedButton type="button" onClick={handleDoneClick}>
                        Done
                    </ThemedButton>
                </div>
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
    staticData: {
        wantsFullPageLayout: true,
        noAuth: true,
    },
})
