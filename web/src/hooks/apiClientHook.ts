import { useRouteContext } from "@tanstack/react-router"

import type { APIClient } from "@/api/client"

export default function useAPIClient(): APIClient {
    const apiClient = useRouteContext({
        from: "__root__",
        select: (context) => context.apiClient,
    })
    return apiClient
}
