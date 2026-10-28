import { CommandIcon, ControlIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import type { Command } from "@/commands/base"
import PaletteShortcut from "@/components/palette/PaletteShortcut"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAppPaletteContext from "@/hooks/appPaletteContext"
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

export default function PaletteButton() {
    const { modifierKey } = useHotKeys()
    const { setIsOpen: setPaletteIsOpen } = useAppPaletteContext()
    const handleTogglePalette = useCallback(() => {
        setPaletteIsOpen((oldValue) => !oldValue)
    }, [setPaletteIsOpen])

    const registry = useCommandRegistry()
    const inputs = useCommandInputs()
    const [highlightedCommands, setHighlightedCommands] = useState<readonly Command[]>([])
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
        function refreshHighlighted() {
            const highlightedCommands = registry.all.filter(
                (command) =>
                    command.highlightAvailability &&
                    command.requiredInputKinds.length > 0 &&
                    inputs.hasAllOf(...command.requiredInputKinds),
            )
            setHighlightedCommands(highlightedCommands)

            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => setHighlightedCommands([]), 7_000)
        }
        refreshHighlighted()
        return combineUnsubscribers(
            registry.subscribe(
                justEventsMatching("type", "registeredCommandsDidChange", refreshHighlighted),
            ),
            inputs.subscribe(
                justEventsMatching("type", "commandInputsDidChange", refreshHighlighted),
            ),
            () => clearTimeout(timeoutId),
        )
    }, [inputs, registry])
    const handleWillExecute = useCallback(() => {
        setHighlightedCommands([])
    }, [])

    return (
        <div className="relative">
            <ThemedSubtleButton onClick={handleTogglePalette}>
                {modifierKey === "meta" ? <CommandIcon /> : <ControlIcon />} K
            </ThemedSubtleButton>
            <AnimatePresence mode="wait">
                {highlightedCommands.length > 0 && (
                    <motion.ol
                        key="highlightedCommands"
                        className="absolute top-full right-0 flex flex-col items-end gap-lg pt-lg"
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
                                <PaletteShortcut
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
