import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import UserSessionButton from "@/components/UserSessionButton"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import { CaretLeftIcon, CommandIcon } from "@phosphor-icons/react"
import { useCanGoBack, useRouter } from "@tanstack/react-router"
import { useCallback, type ReactNode } from "react"

export interface PrimaryHeaderProps {
    readonly children?: ReactNode
}

export default function PrimaryHeader({ children }: PrimaryHeaderProps) {
    const { history } = useRouter()
    const canGoBack = useCanGoBack()
    const { setIsOpen: setCommandPaletteIsOpen } = useAppCommandPaletteContext()
    const handleToggleCommandPalette = useCallback(() => {
        setCommandPaletteIsOpen((oldValue) => !oldValue)
    }, [setCommandPaletteIsOpen])
    return (
        <ThemedHeader
            supplementaryStart={
                <ThemedSubtleButton
                    disabled={!canGoBack}
                    onClick={() => history.back()}
                >
                    <CaretLeftIcon weight="bold" />
                </ThemedSubtleButton>
            }
            supplementaryEnd={
                <>
                    <ThemedSubtleButton onClick={handleToggleCommandPalette}>
                        <CommandIcon /> K
                    </ThemedSubtleButton>
                    <UserSessionButton />
                </>
            }
        >
            {children}
        </ThemedHeader>
    )
}
