import { Menu, MenuItem, MenuItems, type MenuItemsProps } from "@headlessui/react"
import type { OAuth2Scope } from "@magritte/api"
import classNames from "classnames"
import type { ReactNode } from "react"

import AsyncButton from "@/components/reusable/AsyncButton"
import ScopeRestricted from "@/components/reusable/ScopeRestricted"

export type ThemedPopUpMenuItem =
    | {
          readonly isSeparator?: false
          readonly key: string
          readonly label: ReactNode
          readonly disabled?: boolean
          readonly onClick?: () => void | Promise<unknown>
          readonly requiresScopes?: readonly OAuth2Scope[]
      }
    | { readonly isSeparator: true }

export interface ThemedPopUpMenuProps {
    readonly button: ReactNode
    readonly items: readonly ThemedPopUpMenuItem[]
    readonly anchor?: MenuItemsProps["anchor"]
}

export default function ThemedPopUpMenu({
    button,
    items,
    anchor = "bottom",
}: ThemedPopUpMenuProps) {
    return (
        <Menu>
            {button}
            <MenuItems
                anchor={anchor}
                className="bg-secondary rounded-panel shadow-sm text-sm flex flex-col z-100"
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item, index) =>
                    item.isSeparator ? (
                        <div
                            key={`menuItem.separator[${index}]`}
                            className="border-b border-separator"
                        />
                    ) : (
                        <ScopeRestricted
                            key={`menuItem[${item.key}@${index}]`}
                            expected={item.requiresScopes ?? []}
                        >
                            <MenuItem>
                                <AsyncButton
                                    type="button"
                                    className={classNames(
                                        "min-w-32 p-lg text-left whitespace-nowrap",
                                        "flex items-center gap-lg",
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
                    ),
                )}
            </MenuItems>
        </Menu>
    )
}
