import { createFileRoute, redirect } from "@tanstack/react-router"

import PrimaryHeader from "@/components/chrome/PrimaryHeader"

export const Route = createFileRoute("/admin")({
    beforeLoad({ context: { userSession } }) {
        if (!userSession.hasScope("admin")) {
            throw redirect({ to: "/", replace: true })
        }
    },
    component: function AdminLayout() {
        return (
            <div>
                <PrimaryHeader></PrimaryHeader>
                <main className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen"></main>
            </div>
        )
    },
})
