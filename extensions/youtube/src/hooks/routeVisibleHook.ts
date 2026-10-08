import { useContext } from "react"

import { RouteVisibleContext } from "@/contexts/navigationContext"

/** Whether the page this component belongs to is the one on screen */
export default function useIsRouteVisible(): boolean {
    return useContext(RouteVisibleContext)
}
