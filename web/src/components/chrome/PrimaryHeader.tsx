import { CaretLeftIcon, CommandIcon, ControlIcon } from "@phosphor-icons/react"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { useCallback, type ReactNode } from "react"

import NotificationsButton from "@/components/NotificationsButton"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import UserButton from "@/components/UserButton"
import VolumeButton from "@/components/VolumeButton"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"

export interface PrimaryHeaderProps {
    readonly children?: ReactNode
}

export default function PrimaryHeader({ children }: PrimaryHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    const { setIsOpen: setCommandPaletteIsOpen, modifierKey } = useAppCommandPaletteContext()
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
                    <VolumeButton />
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
