import { CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import type React from "react"
import { useCallback, useState, type ReactNode } from "react"

import { dataFlag, toggle } from "@/utilities/react"

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
        <div className={classNames("group", containerClassName)} data-open={dataFlag(isOpen)}>
            <button
                type="button"
                className={classNames(
                    "w-full text-start text-lg font-bold cursor-pointer",
                    "flex items-center gap-sm justify-between",
                    "disabled:opacity-disabled active:bg-primary-active",
                    "group-data-open:mb-lg",
                )}
                onClick={handleHeaderClick}
            >
                {header}
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
