import { GearIcon, UserIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import PageHeader from "@/components/chrome/PageHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"

export const Route = createFileRoute("/user/me")({
    beforeLoad({
        context: {
            api: { userSessionManager },
        },
    }) {
        if (!userSessionManager.current) {
            throw redirect({ to: "/", replace: true })
        }
    },
    component: function UserMeLayout() {
        return (
            <div>
                <PageHeader>
                    <div className="flex items-center gap-0">
                        <ThemedTabItemLink
                            to="/user/me"
                            icon={UserIcon}
                            label="General"
                            activeOptions={{ exact: true }}
                        />
                        <ThemedTabItemLink
                            to="/user/me/extensions"
                            icon={GearIcon}
                            label="Extensions"
                        />
                    </div>
                </PageHeader>
                <main className="p-4 min-h-0 h-screen">
                    <Outlet />
                </main>
            </div>
        )
    },
})
