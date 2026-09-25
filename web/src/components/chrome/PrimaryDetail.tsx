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
        <div className="flex flex-col md:flex-row md:items-stretch md:h-screen">
            <div
                className={classNames(
                    "bg-secondary p-outside",
                    "router-scroll-to-top overflow-auto",
                    "md:w-64 md:pb-32",
                )}
            >
                <h2 className="text-xl font-bold flex items-center gap-between">
                    <ThemedSubtleButton
                        type="button"
                        className="block md:hidden"
                        onClick={handleRevealClick}
                        title={isRevealed ? "Hide" : "Show"}
                    >
                        <ListIcon />
                    </ThemedSubtleButton>{" "}
                    {title}
                </h2>
                <div
                    className="hidden data-revealed:flex md:flex flex-col gap-1 mt-between"
                    data-revealed={dataFlag(isRevealed)}
                >
                    {navigation}
                </div>
            </div>
            <div className="flex-1 p-outside router-scroll-to-top relative overflow-auto pb-32">
                {children}
            </div>
        </div>
    )
}
