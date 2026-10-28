import { matchQuery, notifyManager, type QueryFilters, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

/**
 * Run an effect whenever the data of any query matching the filters changes.
 *
 * @param filters Criteria which a query must match.
 * @param effect An imperative effect.
 */
export default function useQueryChangeEffect(filters: QueryFilters, effect: () => void) {
    const queryCache = useQueryClient().getQueryCache()
    const latest = useRef({ filters, effect })
    useEffect(() => {
        latest.current = { filters, effect }
    })

    useEffect(
        () =>
            queryCache.subscribe(
                notifyManager.batchCalls((event) => {
                    switch (event.type) {
                        case "added":
                        case "removed":
                        case "updated":
                            if (matchQuery(latest.current.filters, event.query)) {
                                latest.current.effect()
                            }
                            break
                        default:
                            break
                    }
                }),
            ),
        [queryCache],
    )
}
