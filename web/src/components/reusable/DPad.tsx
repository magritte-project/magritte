import { motion, type PanInfo } from "motion/react"
import { useCallback, useRef, type ReactNode } from "react"

export interface DPadProps {
    readonly onDragStart?: () => void
    readonly onDragEnd?: () => void
    readonly onDraggedPastStart?: () => void
    readonly onDraggedPastEnd?: () => void
    readonly onDraggedPastTop?: () => void
    readonly onDraggedPastBottom?: () => void
    readonly children: ReactNode
}

export default function DPad({
    onDragStart,
    onDragEnd,
    onDraggedPastStart,
    onDraggedPastEnd,
    onDraggedPastTop,
    onDraggedPastBottom,
    children,
}: DPadProps) {
    const activeDirection = useRef<"x" | "y" | null>(null)

    const handleDirectionLock = useCallback((direction: "x" | "y") => {
        activeDirection.current = direction
    }, [])
    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (activeDirection.current === "x") {
                if (info.offset.x > 0) {
                    onDraggedPastEnd?.()
                } else if (info.offset.x < 0) {
                    onDraggedPastStart?.()
                }
            } else if (activeDirection.current === "y") {
                if (info.offset.y > 0) {
                    onDraggedPastBottom?.()
                } else if (info.offset.y < 0) {
                    onDraggedPastTop?.()
                }
            }
            activeDirection.current = null
            onDragEnd?.()
        },
        [onDraggedPastStart, onDraggedPastEnd, onDraggedPastTop, onDraggedPastBottom, onDragEnd],
    )

    return (
        <motion.div
            drag
            dragDirectionLock
            onDrag={onDragStart}
            onDirectionLock={handleDirectionLock}
            onDragEnd={handleDragEnd}
            dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
            dragElastic={0.2}
            whileDrag={{ cursor: "grabbing" }}
        >
            {children}
        </motion.div>
    )
}
