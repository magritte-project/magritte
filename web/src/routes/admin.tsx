import { GearIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"

export const Route = createFileRoute("/admin")({
    beforeLoad({
        context: {
            api: { userSessionManager },
        },
    }) {
        if (!userSessionManager.hasScope("admin")) {
            throw redirect({ to: "/", replace: true })
        }
    },
    component: function AdminLayout() {
        return (
            <div>
                <PrimaryHeader>
                    <div className="flex items-center gap-0">
                        <ThemedTabItemLink
                            to="/admin/extensions"
                            icon={GearIcon}
                            label="Extensions"
                        />
                    </div>
                </PrimaryHeader>
                <main className="p-4 min-h-0 h-screen">
                    <Outlet />
                </main>
            </div>
        )
    },
})
