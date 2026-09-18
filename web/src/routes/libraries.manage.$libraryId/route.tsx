import { ArrowsClockwiseIcon, GearSixIcon, ListIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import { useRequestSyncLibrary } from "@/api/mutations/ingest"
import ModalHeader from "@/components/chrome/ModalHeader"
import Modal from "@/components/reusable/Modal"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/manage/$libraryId")({
    component: function ManageRoute() {
        const { libraryId } = Route.useParams()
        const navigate = useNavigate({ from: Route.fullPath })
        const handleDismiss = useCallback(() => {
            navigate({
                to: "/libraries",
                replace: true,
            })
        }, [navigate])

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
            <Modal className="min-w-full md:min-w-150" onDismiss={handleDismiss}>
                <ModalHeader>
                    <div className="flex-1 flex items-center gap-0">
                        <ThemedTabItemLink
                            to="/libraries/manage/$libraryId"
                            params={{ libraryId }}
                            activeOptions={{ exact: true }}
                            icon={GearSixIcon}
                            label="General"
                        />
                        <ThemedTabItemLink
                            to="/libraries/manage/$libraryId/permissions"
                            params={{ libraryId }}
                            icon={UsersThreeIcon}
                            label="Permissions"
                        />
                        <ThemedTabItemLink
                            to="/libraries/manage/$libraryId/ignored"
                            params={{ libraryId }}
                            icon={ListIcon}
                            label="Ignored"
                        />
                    </div>
                    <ThemedSubtleButton
                        className="flex items-center gap-1 px-3! py-1!"
                        onClick={handleSyncLibrary}
                        disabled={syncLibraryMutation.isPending}
                    >
                        <ArrowsClockwiseIcon size="2em" weight="light" /> Sync
                    </ThemedSubtleButton>
                </ModalHeader>
                <Outlet />
            </Modal>
        )
    },
})
