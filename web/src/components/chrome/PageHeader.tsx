import { CaretLeftIcon, CommandIcon, ControlIcon } from "@phosphor-icons/react"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { useCallback, type ReactNode } from "react"

import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import NotificationsButton from "@/components/user/NotificationsButton"
import UserButton from "@/components/user/UserButton"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useHotKeys from "@/hooks/hotKeysHook"

export interface PageHeaderProps {
    readonly children?: ReactNode
}

export default function PageHeader({ children }: PageHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    const { modifierKey } = useHotKeys()
    const { setIsOpen: setCommandPaletteIsOpen } = useAppCommandPaletteContext()
    const handleToggleCommandPalette = useCallback(() => {
        setCommandPaletteIsOpen((oldValue) => !oldValue)
    }, [setCommandPaletteIsOpen])
    return (
        <ThemedHeader
            supplementaryStart={
                <ThemedSubtleButton disabled={!canGoBack} onClick={() => history.back()}>
                    <CaretLeftIcon weight="bold" />
                </ThemedSubtleButton>
            }
            supplementaryEnd={
                <>
                    <ThemedSubtleButton onClick={handleToggleCommandPalette}>
                        {modifierKey === "meta" ? <CommandIcon /> : <ControlIcon />} K
                    </ThemedSubtleButton>
                    <NotificationsButton />
                    <UserButton />
                </>
            }
        >
            {children}
        </ThemedHeader>
    )
}
