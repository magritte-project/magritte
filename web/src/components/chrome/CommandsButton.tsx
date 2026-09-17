import { CommandIcon, ControlIcon } from "@phosphor-icons/react"
import { useCallback } from "react"

import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useHotKeys from "@/hooks/hotKeysHook"

export default function CommandsButton() {
    const { modifierKey } = useHotKeys()
    const { setIsOpen: setCommandPaletteIsOpen } = useAppCommandPaletteContext()
    const handleToggleCommandPalette = useCallback(() => {
        setCommandPaletteIsOpen((oldValue) => !oldValue)
    }, [setCommandPaletteIsOpen])
    return (
        <ThemedSubtleButton onClick={handleToggleCommandPalette}>
            {modifierKey === "meta" ? <CommandIcon /> : <ControlIcon />} K
        </ThemedSubtleButton>
    )
}
