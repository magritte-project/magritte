import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import useDismiss from "@/hooks/dismissHook"

export interface ModalProps {
    readonly className?: string
    readonly isPresented?: boolean
    readonly onDismiss?: () => void
    readonly children?: ReactNode
}

export default function Modal({ className, isPresented = true, onDismiss, children }: ModalProps) {
    const dismiss = useDismiss()
    return createPortal(
        <DismissContextProvider value={onDismiss ?? dismiss}>
            <AnimatePresence mode="wait" key="Modal">
                {isPresented && (
                    <motion.div
                        className="fixed inset-0 overlay-material-hard flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => (onDismiss ?? dismiss)()}
                    >
                        <motion.div
                            className={classNames(
                                "relative bg-primary rounded-lg drop-shadow-2xl max-h-full md:max-h-2/3 overflow-auto",
                                className,
                            )}
                            initial={{ y: -10, scale: 0.9 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: -10, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DismissContextProvider>,
        document.getElementById("app-modals")!,
        "Modal",
    )
}
