import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/settings/admin")({
    beforeLoad({
        context: {
            api: { userSessionManager },
        },
    }) {
        if (!userSessionManager.hasScope("admin")) {
            throw redirect({ to: "/settings", replace: true })
        }
    },
})
