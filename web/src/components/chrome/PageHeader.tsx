import { CaretLeftIcon } from "@phosphor-icons/react"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { type ReactNode } from "react"

import LibrariesButton from "@/components/chrome/LibrariesButton"
import LibraryTabs from "@/components/chrome/LibraryTabs"
import PaletteButton from "@/components/chrome/PaletteButton"
import UserButton from "@/components/chrome/UserButton"
import UserNotificationsButton from "@/components/chrome/UserNotificationsButton"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useIsInstalledApp from "@/hooks/installedAppHook"

export interface PageHeaderProps {
    readonly children?: ReactNode
}

export default function PageHeader({ children }: PageHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()

    const isInstalledApp = useIsInstalledApp()
    return (
        <ThemedHeader
            supplementaryStart={
                isInstalledApp ? (
                    <ThemedSubtleButton disabled={!canGoBack} onClick={() => history.back()}>
                        <CaretLeftIcon weight="bold" />
                    </ThemedSubtleButton>
                ) : undefined
            }
            supplementaryEnd={
                <>
                    <PaletteButton />
                    <UserNotificationsButton />
                    <UserButton />
                </>
            }
        >
            <div className="flex items-center gap-0 drop-shadow-xs">
                <LibrariesButton />
            </div>
            <LibraryTabs className="hidden md:flex" />

            {children}
        </ThemedHeader>
    )
}
