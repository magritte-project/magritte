import { CaretLeftIcon } from "@phosphor-icons/react"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { useMediaQuery } from "@uidotdev/usehooks"
import { type ReactNode } from "react"

import PaletteButton from "@/components/chrome/PaletteButton"
import UserButton from "@/components/chrome/UserButton"
import UserNotificationsButton from "@/components/chrome/UserNotificationsButton"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"

export interface PageHeaderProps {
    readonly children?: ReactNode
}

export default function PageHeader({ children }: PageHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    const isStandalone = useMediaQuery("(display-mode: standalone)")
    return (
        <ThemedHeader
            supplementaryStart={
                <ThemedSubtleButton
                    className={!isStandalone ? "hidden" : undefined}
                    disabled={!canGoBack}
                    onClick={() => history.back()}
                >
                    <CaretLeftIcon weight="bold" />
                </ThemedSubtleButton>
            }
            supplementaryEnd={
                <>
                    <PaletteButton />
                    <UserNotificationsButton />
                    <UserButton />
                </>
            }
        >
            {children}
        </ThemedHeader>
    )
}
