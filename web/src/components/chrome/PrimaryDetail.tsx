import { ListIcon } from "@phosphor-icons/react"
import { useRouterState } from "@tanstack/react-router"
import { useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { dataFlag } from "@/utilities/react"

export interface PrimaryDetailProps {
    readonly title: ReactNode
    readonly navigation: ReactNode
    readonly children?: ReactNode
}

export default function PrimaryDetail({ title, navigation, children }: PrimaryDetailProps) {
    const [isRevealed, setIsRevealed] = useState(false)

    const isSm = useMediaQuery("(max-width: 768px)")
    const currentHref = useRouterState({ select: (state) => state.location.href })
    useEffect(() => {
        return () => {
            setIsRevealed(false)
        }
    }, [currentHref])
    useEffect(() => {
        if (!isSm && isRevealed) {
            setIsRevealed(false)
        }
    }, [isSm, isRevealed])

    const handleRevealClick = useCallback(() => {
        setIsRevealed((prev) => !prev)
    }, [setIsRevealed])

    return (
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:h-screen">
            <div
                className={classNames(
                    "bg-tertiary p-lg",
                    "router-scroll-to-top overflow-auto",
                    "lg:fixed inset-y-0 l-0 lg:w-64 lg:pt-header lg:pb-footer",
                )}
            >
                <h2 className="text-xl font-bold flex items-center gap-lg">
                    <ThemedSubtleButton
                        type="button"
                        className="block lg:hidden"
                        onClick={handleRevealClick}
                        title={isRevealed ? "Hide" : "Show"}
                    >
                        <ListIcon />
                    </ThemedSubtleButton>{" "}
                    {title}
                </h2>
                <div
                    className="hidden data-revealed:flex lg:flex flex-col gap-sm mt-lg"
                    data-revealed={dataFlag(isRevealed)}
                >
                    {navigation}
                </div>
            </div>
            <div className="flex-1 p-lg lg:ml-64">{children}</div>
        </div>
    )
}
