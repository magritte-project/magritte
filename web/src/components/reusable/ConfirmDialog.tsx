import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, type ReactNode } from "react"

import ThemedButton from "@/components/theme/ThemedButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"

export interface ConfirmDialogProps {
    readonly isPresented: boolean
    readonly dismiss: (result: boolean) => void
    readonly title: ReactNode
    readonly message: ReactNode
    readonly cancel: ReactNode
    readonly confirm: ReactNode
}

export default function ConfirmDialog({
    isPresented,
    dismiss,
    title,
    message,
    cancel,
    confirm,
}: ConfirmDialogProps) {
    const onCancel = useCallback(() => dismiss(false), [dismiss])
    const onConfirm = useCallback(() => dismiss(true), [dismiss])
    return (
        <AnimatePresence>
            {isPresented && (
                <Dialog static open={isPresented} onClose={onCancel} className="relative z-50">
                    <DialogBackdrop
                        as={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-xs"
                    />

                    <div className="fixed inset-0 flex w-screen items-center justify-center p-outside">
                        <DialogPanel
                            as={motion.div}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-lg space-y-2 p-outside drop-shadow-2xl shadow-black bg-primary/90 rounded-lg"
                        >
                            <DialogTitle className="font-bold">{title}</DialogTitle>
                            <Description className="text-sm text-on-secondary">
                                {message}
                            </Description>
                            <div className="flex items-center justify-end gap-between text-sm">
                                <ThemedSubtleButton type="button" onClick={onCancel}>
                                    {cancel}
                                </ThemedSubtleButton>
                                <ThemedButton type="button" onClick={onConfirm} autoFocus>
                                    {confirm}
                                </ThemedButton>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    )
}
