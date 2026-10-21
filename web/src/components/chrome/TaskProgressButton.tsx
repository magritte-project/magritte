import { getErrorMessage } from "@magritte/rpc"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useSyncExternalStore } from "react"

import ThemedCircularProgress from "@/components/theme/ThemedCircularProgress"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useTaskProgressReporter from "@/hooks/taskProgressReporterHook"
import { justEventsMatching } from "@/utilities/events"

export default function TaskProgressButton() {
    const taskProgressReporter = useTaskProgressReporter()
    const activeTaskCount = useSyncExternalStore(
        (onStoreChange) =>
            taskProgressReporter.subscribe((event) => {
                switch (event.type) {
                    case "taskStarted":
                    case "taskEnded":
                        onStoreChange()
                        break
                    case "taskFailed":
                        if (!event.handled) {
                            onStoreChange()
                            break
                        }
                        break
                    default:
                        break
                }
            }),
        () => taskProgressReporter.activeTaskCount,
    )
    const completedPercent = useSyncExternalStore(
        (onStoreChange) => taskProgressReporter.subscribe(onStoreChange),
        () => taskProgressReporter.completedPercent,
    )

    const notificationCenter = useNotificationCenter()
    useEffect(
        () =>
            taskProgressReporter.subscribe(
                justEventsMatching("type", "taskFailed", ({ label, reason, handled }) => {
                    if (handled) {
                        notificationCenter.showToast({
                            message: `${label} encountered issue: ${getErrorMessage(reason)}`,
                            type: "warning",
                        })
                    } else {
                        notificationCenter.showToast({
                            message: `${label} failed: ${getErrorMessage(reason)}`,
                            type: "error",
                        })
                    }
                }),
            ),
        [taskProgressReporter, notificationCenter],
    )

    return (
        <AnimatePresence>
            {activeTaskCount > 0 && (
                <motion.div className="relative">
                    <ThemedCircularProgress
                        containerClassName="size-7"
                        strokeWidth="3"
                        max={1}
                        current={completedPercent}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-1/2 pt-px text-xs font-bold"
                        aria-label={activeTaskCount === 1 ? "1 task" : `${activeTaskCount} tasks`}
                    >
                        {activeTaskCount}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
