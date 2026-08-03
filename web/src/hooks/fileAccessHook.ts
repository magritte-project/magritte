import type { FileAccess } from "@magritte/api"
import { useRouteContext } from "@tanstack/react-router"

export default function useFileAccess(): FileAccess {
    const fileAccess = useRouteContext({
        from: "__root__",
        select: (context) => context.fileAccess,
    })
    return fileAccess
}
