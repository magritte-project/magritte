import { useRouteContext } from "@tanstack/react-router"

import type { TaskProgressReporter } from "@/utilities/taskProgress"

export default function useTaskProgressReporter(): TaskProgressReporter {
    const taskProgressReporter = useRouteContext({
        from: "__root__",
        select: (context) => context.taskProgressReporter,
    })
    return taskProgressReporter
}
