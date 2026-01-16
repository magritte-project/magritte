import { useRouteContext } from "@tanstack/react-router"

import type SplitRegistry from "@/splits/registry"

export default function useSplitRegistry(): SplitRegistry {
    const splitRegister = useRouteContext({
        from: "__root__",
        select: (context) => context.splitRegister,
    })
    return splitRegister
}
