import { Menu, MenuItem, MenuItems } from "@headlessui/react"
import type { ReactNode } from "react"

import type { OAuth2Scope } from "@/api/openapi"
import AsyncButton from "@/components/reusable/AsyncButton"

import ScopeRestricted from "../reusable/ScopeRestricted"

export interface ThemedPopUpMenuItem {
    readonly key: string
    readonly label: ReactNode
    readonly disabled?: boolean
    readonly onClick?: () => void | Promise<unknown>
    readonly requiresScopes?: readonly OAuth2Scope[]
}

export interface ThemedPopUpMenuProps {
    readonly button: ReactNode
    readonly items: readonly ThemedPopUpMenuItem[]
}

export default function ThemedPopUpMenu({ button, items }: ThemedPopUpMenuProps) {
    return (
        <Menu>
            {button}
            <MenuItems
                anchor="bottom"
                className="bg-white rounded-md shadow-sm text-sm flex flex-col z-100"
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item) => (
                    <ScopeRestricted key={item.key} expected={item.requiresScopes ?? []}>
                        <MenuItem>
                            <AsyncButton
                                type="button"
                                className="min-w-32 text-left p-2 flex items-center gap-2 hover:bg-blue-600 hover:text-white disabled:hover:bg-inherit disabled:hover:text-inherit disabled:opacity-70"
                                onClick={item.onClick}
                                disabled={item.disabled}
                            >
                                {item.label}
                            </AsyncButton>
                        </MenuItem>
                    </ScopeRestricted>
                ))}
            </MenuItems>
        </Menu>
    )
}
