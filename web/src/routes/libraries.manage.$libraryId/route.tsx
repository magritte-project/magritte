import { getErrorMessage } from "@magritte/rpc"
import { ArrowsClockwiseIcon, GearSixIcon, ListIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useCallback } from "react"

import { useRequestSyncLibrary } from "@/api/mutations/ingest"
import PrimaryDetail from "@/components/chrome/PrimaryDetail"
import ThemedSidebarItemLink from "@/components/theme/ThemedSidebarItemLabelThemedSidebarItemLink"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/libraries/manage/$libraryId")({
    component: function ManageRoute() {
        const { libraryId } = Route.useParams()

        const notificationCenter = useNotificationCenter()
        const syncLibraryMutation = useRequestSyncLibrary(Number(libraryId))
        const handleSyncLibrary = useCallback(async () => {
            try {
                await syncLibraryMutation.mutateAsync()
            } catch (error) {
                notificationCenter.showToast({
                    message: `Failed to start library sync: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        }, [notificationCenter, syncLibraryMutation])

        return (
            <PrimaryDetail
                title={
                    <div className="flex items-center gap-lg w-full">
                        <div className="flex-1">Edit</div>
                        <div className="text-base">
                            <ThemedSubtleButton
                                className="flex items-center gap-sm px-lg! py-1!"
                                onClick={handleSyncLibrary}
                                disabled={syncLibraryMutation.isPending}
                            >
                                <ArrowsClockwiseIcon />
                            </ThemedSubtleButton>
                        </div>
                    </div>
                }
                navigation={
                    <>
                        <ThemedSidebarItemLink
                            to="/libraries/manage/$libraryId"
                            params={{ libraryId }}
                            activeOptions={{ exact: true }}
                            icon={GearSixIcon}
                            label="General"
                        />
                        <ThemedSidebarItemLink
                            to="/libraries/manage/$libraryId/permissions"
                            params={{ libraryId }}
                            icon={UsersThreeIcon}
                            label="Permissions"
                        />
                        <ThemedSidebarItemLink
                            to="/libraries/manage/$libraryId/ignored"
                            params={{ libraryId }}
                            icon={ListIcon}
                            label="Ignored"
                        />
                    </>
                }
            >
                <Outlet />
            </PrimaryDetail>
        )
    },
})
