import { readAvailableServices } from "@/api/queries/services"
import Modal from "@/components/reusable/Modal"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPIClient from "@/hooks/apiClientHook"
import { XIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
    createFileRoute,
    Outlet,
    useNavigate,
    useParams,
} from "@tanstack/react-router"
import { useCallback } from "react"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add")({
    component: function AddLayout() {
        const apiClient = useAPIClient()
        const { data: availableServices } = useSuspenseQuery(
            readAvailableServices(apiClient),
        )
        const navigate = useNavigate()
        const { libraryId } = Route.useParams()
        const { service: selectedService } = useParams({ strict: false })

        const handleDismiss = useCallback(() => {
            navigate({
                to: "/libraries/$libraryId/songs",
                params: { libraryId },
            })
        }, [navigate, libraryId])

        return (
            <Modal
                className="min-w-full md:min-w-[600px]"
                onDismiss={handleDismiss}
            >
                <div className="flex items-center gap-2 p-2">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="cursor-pointer"
                    >
                        <XIcon weight="bold" aria-label="Close" />
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                        {availableServices.map((service) => (
                            <button
                                key={service.name}
                                type="button"
                                className={`
                                    font-semibold text-sm select-none
                                    px-2 py-1 cursor-pointer 
                                    border border-blue-600 first:rounded-l-md last:rounded-r-md
                                    bg-white text-blue-600
                                    data-active:bg-blue-600 data-active:text-white
                                `}
                                data-active={
                                    selectedService === service.name
                                        ? ""
                                        : undefined
                                }
                                onKeyDown={() => {}}
                                onClick={() =>
                                    navigate({
                                        to: "/libraries/$libraryId/songs/add/$service",
                                        params: {
                                            libraryId,
                                            service: service.name,
                                        },
                                    })
                                }
                            >
                                {service.display_name}
                            </button>
                        ))}
                    </div>
                </div>
                <Outlet />
            </Modal>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
