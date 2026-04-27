import { useState } from "react"
import CommandPalette, { filterItems, getItemIndex, useHandleOpenCommandPalette } from "react-cmdk"

import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useCommands from "@/hooks/commandsHook"

import "react-cmdk/dist/cmdk.css"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen, items: pages } = useAppCommandPaletteContext()
    const commands = useCommands({ search })

    const filteredItems = filterItems([...pages], search)

    const allItems = [
        {
            id: "newCommandSystem",
            heading: "Commands",
            items: commands,
        },
        ...filteredItems,
    ]

    useHandleOpenCommandPalette(setIsOpen)

    return (
        <CommandPalette
            onChangeSearch={setSearch}
            onChangeOpen={setIsOpen}
            isOpen={isOpen}
            search={search}
            page="all"
        >
            <CommandPalette.Page id="all">
                {allItems.length ? (
                    allItems.map((list) => (
                        <CommandPalette.List key={list.id} heading={list.heading}>
                            {list.items.map(({ id, ...rest }) => (
                                <CommandPalette.ListItem
                                    key={id}
                                    index={getItemIndex(allItems, id)}
                                    {...rest}
                                />
                            ))}
                        </CommandPalette.List>
                    ))
                ) : (
                    <CommandPalette.FreeSearchAction />
                )}
            </CommandPalette.Page>
        </CommandPalette>
    )
}
