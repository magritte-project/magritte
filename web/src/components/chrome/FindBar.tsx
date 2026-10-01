import { XIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { useCallback, useMemo, useState } from "react"

import type { Command } from "@/commands/base"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import useHotKey from "@/hooks/hotKeyHook"
import { toggle } from "@/utilities/react"

export type FindBarProps = React.HTMLAttributes<HTMLDivElement>

export default function FindBar({ className, onKeyDown, children, ...rest }: FindBarProps) {
    const [isVisible, setIsVisible] = useState(false)
    useHotKey({ key: "f" }, () => {
        setIsVisible(true)
        const scrollTargets = document.querySelectorAll(".router-scroll-to-top")
        for (const target of scrollTargets) {
            target.scrollTo(0, 0)
        }
        return true
    })
    const handleDismiss = useCallback(() => setIsVisible(false), [])
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") {
                e.stopPropagation()
                e.preventDefault()
                handleDismiss()
            } else {
                onKeyDown?.(e)
            }
        },
        [handleDismiss, onKeyDown],
    )
    const commands = useMemo(
        () => [
            {
                id: "findBar.toggle",
                searchTerms: "show hide find in page",
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: isVisible ? "page: Close find" : "page: Find",
                }),
                execute: async () => setIsVisible(toggle),
            } satisfies Command,
        ],
        [isVisible],
    )
    return (
        <CommandsProvider commands={commands}>
            <DismissContextProvider value={handleDismiss}>
                {isVisible && (
                    <div
                        className={classNames("flex items-center gap-lg", className)}
                        onKeyDown={handleKeyDown}
                        {...rest}
                    >
                        {children}
                        <ThemedSubtleButton type="button" title="close" onClick={handleDismiss}>
                            <XIcon />
                        </ThemedSubtleButton>
                    </div>
                )}
            </DismissContextProvider>
        </CommandsProvider>
    )
}
