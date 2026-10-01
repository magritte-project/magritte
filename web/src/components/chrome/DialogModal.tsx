import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { defaultDialogButtons, type DialogOptions } from "@magritte/sdk"
import { motion } from "motion/react"
import { useEffect } from "react"

import DialogIcon from "@/components/reusable/DialogIcon"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useHotKeys from "@/hooks/hotKeysHook"

export interface DialogModalProps {
    readonly options: DialogOptions
    readonly onDismiss: (buttonId?: number) => void
}

export default function DialogModal({ options, onDismiss }: DialogModalProps) {
    const { registerHotKey } = useHotKeys()
    useEffect(() => {
        const buttons = [...(options.buttons ?? defaultDialogButtons)].reverse()

        const primaryButton = buttons.find((button) => button.role === "primary")
        if (primaryButton !== undefined) {
            return registerHotKey({ key: "Enter", requiresModifier: false }, () => {
                onDismiss(primaryButton.id)
                return true
            })
        }

        const destructiveButton = buttons.find((button) => button.role === "destructive")
        if (destructiveButton !== undefined) {
            return registerHotKey({ key: "Backspace" }, () => {
                onDismiss(destructiveButton.id)
                return true
            })
        }
    }, [options.buttons, registerHotKey, onDismiss])
    return (
        <Dialog static open onClose={() => onDismiss()} className="relative">
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
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    className="max-w-lg space-y-2 p-outside drop-shadow-2xl shadow-black bg-primary/90 rounded-panel"
                >
                    <div className="flex items-start gap-between">
                        <DialogIcon
                            type={options.type}
                            className="text-key"
                            size="2rem"
                            weight="duotone"
                        />
                        <div className="flex flex-col">
                            <DialogTitle className="font-bold">{options.title}</DialogTitle>
                            <Description className="text-sm text-on-secondary">
                                {options.message}
                            </Description>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-between text-sm">
                        {(options.buttons ?? defaultDialogButtons).map((button, index) => {
                            switch (button.role) {
                                case "primary":
                                case "destructive":
                                    return (
                                        <ThemedButton
                                            key={`dialog.buttons[${button.id}@${index}]`}
                                            type="button"
                                            destructive={button.role === "destructive"}
                                            onClick={() => onDismiss(button.id)}
                                        >
                                            {button.label}
                                        </ThemedButton>
                                    )
                                case "secondary":
                                    return (
                                        <ThemedSubtleButton
                                            key={`dialog.buttons[${button.id}@${index}]`}
                                            type="button"
                                            onClick={() => onDismiss(button.id)}
                                        >
                                            {button.label}
                                        </ThemedSubtleButton>
                                    )
                            }
                        })}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
