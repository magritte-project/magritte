import { useMemo, useState } from "react"
import CommandPalette, {
    filterItems,
    getItemIndex,
    useHandleOpenCommandPalette,
    type JsonStructure,
    type JsonStructureItem,
} from "react-cmdk"

import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useCommandSystem from "@/hooks/commandSystemHook"
import useServiceRegistry from "@/hooks/serviceRegistryHook"

import "react-cmdk/dist/cmdk.css"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")
    const serviceRegistry = useServiceRegistry()
    const commandSystem = useCommandSystem()

    const { isOpen, setIsOpen, items: pages } = useAppCommandPaletteContext()
    const items = useMemo(() => {
        const results = commandSystem.search(search)
        return [
            {
                id: "newCommandSystem",
                heading: "New Command System",
                items: results.map(
                    (result): JsonStructureItem => ({
                        id: result.item.id,
                        children: result.item.displayName,
                        onClick: () => commandSystem.execute(result.item),
                    }),
                ),
            },
        ] satisfies JsonStructure
    }, [commandSystem, search])

    const filteredItems = filterItems(
        [
            ...pages,
            // TODO: This is kind of a jank way to inject global actions...
            ...serviceRegistry.commands,
        ],
        search,
    )

    const allItems = [...items, ...filteredItems]

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
