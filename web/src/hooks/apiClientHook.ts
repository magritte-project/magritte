import type { APIClient } from "@magritte/api"
import { useRouteContext } from "@tanstack/react-router"

export default function useAPIClient(): APIClient {
    const apiClient = useRouteContext({
        from: "__root__",
        select: (context) => context.apiClient,
    })
    return apiClient
}
