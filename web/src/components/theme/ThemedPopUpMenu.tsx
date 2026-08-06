import { Menu, MenuItem, MenuItems } from "@headlessui/react"
import type { OAuth2Scope } from "@magritte/api"
import classNames from "classnames"
import type { ReactNode } from "react"

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
                className="bg-primary rounded-md shadow-sm text-sm flex flex-col z-100"
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item) => (
                    <ScopeRestricted key={item.key} expected={item.requiresScopes ?? []}>
                        <MenuItem>
                            <AsyncButton
                                type="button"
                                className={classNames(
                                    "min-w-32 p-outside text-left",
                                    "flex items-center gap-between",
                                    "hover:bg-key disabled:hover:bg-inherit",
                                    "hover:text-on-key disabled:hover:text-inherit",
                                    "disabled:opacity-disabled",
                                )}
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
