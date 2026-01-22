import { GearSixIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import ModalHeader from "@/components/chrome/ModalHeader"
import Modal from "@/components/reusable/Modal"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"

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

        return (
            <Modal className="min-w-full md:min-w-[600px]" onDismiss={handleDismiss}>
                <ModalHeader>
                    <div className="flex items-center gap-0">
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
                    </div>
                </ModalHeader>
                <Outlet />
            </Modal>
        )
    },
})
