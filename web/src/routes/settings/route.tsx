import { GearIcon, PuzzlePieceIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import PrimaryDetail from "@/components/chrome/PrimaryDetail"
import ThemedSidebarItemLink from "@/components/theme/ThemedSidebarItemLabelThemedSidebarItemLink"
import ThemedSidebarSectionHeader from "@/components/theme/ThemedSidebarSectionHeader"
import useUserSession from "@/hooks/userSessionHook"

export const Route = createFileRoute("/settings")({
    component: function Settings() {
        const userSession = useUserSession()
        return (
            <>
                <PrimaryDetail
                    title="Settings"
                    navigation={
                        <>
                            <ThemedSidebarSectionHeader>User</ThemedSidebarSectionHeader>
                            <ThemedSidebarItemLink
                                icon={GearIcon}
                                label="General"
                                to="/settings/user/general"
                            />
                            <ThemedSidebarItemLink
                                icon={PuzzlePieceIcon}
                                label="Extensions"
                                to="/settings/user/extensions"
                            />
                            {userSession.current?.scopes.includes("admin") && (
                                <>
                                    <ThemedSidebarSectionHeader>Admin</ThemedSidebarSectionHeader>
                                    <ThemedSidebarItemLink
                                        icon={GearIcon}
                                        label="Manage Extensions"
                                        to="/settings/admin/extensions"
                                    />
                                    <ThemedSidebarItemLink
                                        icon={UsersThreeIcon}
                                        label="Manage Users"
                                        to="/settings/admin/users"
                                    />
                                </>
                            )}
                        </>
                    }
                >
                    <Outlet />
                </PrimaryDetail>
            </>
        )
    },
})
