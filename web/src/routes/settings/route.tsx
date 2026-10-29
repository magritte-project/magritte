import {
    FilesIcon,
    GearIcon,
    PaletteIcon,
    PuzzlePieceIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import PrimaryDetail from "@/components/chrome/PrimaryDetail"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
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
                            <ThemedSidebarItemLink
                                icon={PaletteIcon}
                                label="Theme"
                                to="/settings/user/theme"
                            />
                            <ThemedSidebarItemLink
                                icon={FilesIcon}
                                label="Downloads"
                                to="/settings/user/downloads"
                            />
                            <ThemedSidebarSectionHeader>Magritte</ThemedSidebarSectionHeader>
                            <ThemedSidebarItemLink
                                icon={WarningCircleIcon}
                                label="About"
                                to="/settings/about"
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
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
