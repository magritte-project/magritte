import { CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import type React from "react"
import { useCallback, useState, type ReactNode } from "react"

import { toggle } from "@/utilities/react"

export interface ThemedSectionProps extends React.ComponentProps<typeof motion.div> {
    readonly containerClassName?: string
    readonly header?: ReactNode
    readonly defaultsOpen?: boolean
}

export default function ThemedSection({
    containerClassName,
    header,
    defaultsOpen = false,
    ...rest
}: ThemedSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultsOpen)
    const handleHeaderClick = useCallback(() => setIsOpen(toggle), [])
    return (
        <div className={containerClassName}>
            <button
                type="button"
                className="w-full text-start cursor-pointer flex items-center gap-sm [&>*:first-child]:flex-1"
                onClick={handleHeaderClick}
            >
                {header}{" "}
                {isOpen ? <CaretUpIcon aria-label="Close" /> : <CaretDownIcon aria-label="Open" />}
            </button>
            <AnimatePresence initial={false} mode="popLayout">
                {isOpen && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        {...rest}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
