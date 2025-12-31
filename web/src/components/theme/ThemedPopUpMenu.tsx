import AsyncButton from "@/components/reusable/AsyncButton"
import { Menu, MenuItem, MenuItems } from "@headlessui/react"
import type { ReactNode } from "react"

export interface ThemedPopUpMenuItem {
    readonly key: string
    readonly label: ReactNode
    readonly disabled?: boolean
    readonly onClick?: () => undefined | Promise<void>
}

export interface ThemedPopUpMenuProps {
    readonly button: ReactNode
    readonly items: readonly ThemedPopUpMenuItem[]
}

export default function ThemedPopUpMenu({
    button,
    items,
}: ThemedPopUpMenuProps) {
    return (
        <Menu>
            {button}
            <MenuItems
                anchor="bottom"
                className="bg-white rounded-md shadow-sm text-sm flex flex-col gap-2 z-100"
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item) => (
                    <MenuItem key={item.key}>
                        <AsyncButton
                            type="button"
                            className="min-w-32 text-left p-2 flex items-center gap-2 hover:bg-blue-600 hover:text-white"
                            onClick={item.onClick}
                        >
                            {item.label}
                        </AsyncButton>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    )
}
