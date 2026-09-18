import { CommandIcon, ControlIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import type { Command } from "@/commands/base"
import HighlightedCommandButton from "@/components/commands/HighlightedCommandButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommandRegistry from "@/hooks/commandRegistryHook"
import useHotKeys from "@/hooks/hotKeysHook"
import { combineUnsubscribers, justEventsMatching } from "@/utilities/events"

const highlightedCommandListVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
}
const highlightedCommandItemVariants: Variants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0 },
}

export default function CommandsButton() {
    const { modifierKey } = useHotKeys()
    const { setIsOpen: setCommandPaletteIsOpen } = useAppCommandPaletteContext()
    const handleToggleCommandPalette = useCallback(() => {
        setCommandPaletteIsOpen((oldValue) => !oldValue)
    }, [setCommandPaletteIsOpen])

    const registry = useCommandRegistry()
    const inputs = useCommandInputs()
    const [highlightedCommands, setHighlightedCommands] = useState<readonly Command[]>([])
    useEffect(() => {
        function refreshHighlighted() {
            const highlightedCommands = registry.all.filter(
                (command) =>
                    command.highlightAvailability &&
                    command.requiredInputKinds.length > 0 &&
                    inputs.hasAllOf(...command.requiredInputKinds),
            )
            setHighlightedCommands(highlightedCommands)
        }
        refreshHighlighted()
        return combineUnsubscribers(
            registry.subscribe(
                justEventsMatching("type", "registeredCommandsDidChange", refreshHighlighted),
            ),
            inputs.subscribe(
                justEventsMatching("type", "commandInputsDidChange", refreshHighlighted),
            ),
        )
    }, [inputs, registry])
    const handleWillExecute = useCallback(() => {
        setHighlightedCommands([])
    }, [])

    return (
        <div className="relative">
            <ThemedSubtleButton onClick={handleToggleCommandPalette}>
                {modifierKey === "meta" ? <CommandIcon /> : <ControlIcon />} K
            </ThemedSubtleButton>
            <AnimatePresence mode="wait">
                {highlightedCommands.length > 0 && (
                    <motion.ol
                        key="highlightedCommands"
                        className="absolute top-full right-0 flex flex-col items-end gap-between pt-outside"
                        variants={highlightedCommandListVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {highlightedCommands.map((command) => (
                            <motion.li
                                key={`highlightedCommands[${command.id}]`}
                                layout
                                variants={highlightedCommandItemVariants}
                            >
                                <HighlightedCommandButton
                                    inputs={inputs}
                                    command={command}
                                    onWillExecute={handleWillExecute}
                                />
                            </motion.li>
                        ))}
                    </motion.ol>
                )}
            </AnimatePresence>
        </div>
    )
}
