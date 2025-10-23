import { readMe } from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

export function userProfile(enabled = true) {
    return queryOptions({
        queryKey: ["readMe"],
        queryFn: () => readMe(),
        enabled,
    })
}
