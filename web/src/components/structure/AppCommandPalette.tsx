import { useMemo, useState } from "react"
import CommandPalette, {
    getItemIndex,
    useHandleOpenCommandPalette,
    type JsonStructure,
    type JsonStructureItem,
} from "react-cmdk"

import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useCommandInputs from "@/hooks/commandInputsHook"

import "react-cmdk/dist/cmdk.css"
import useCommands from "@/hooks/commandsHook"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen } = useAppCommandPaletteContext()
    const inputs = useCommandInputs()
    const commands = useCommands({ search })
    const items = useMemo(
        (): JsonStructure => [
            {
                id: "commands",
                items: commands.map(
                    (result): JsonStructureItem => ({
                        id: result.id,
                        children: result.displayName(inputs),
                        onClick: () => result.execute(inputs),
                        disabled: result.disabled?.(inputs),
                    }),
                ),
            },
        ],
        [inputs, commands],
    )

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
                {items.length ? (
                    items.map((list) => (
                        <CommandPalette.List key={list.id} heading={list.heading}>
                            {list.items.map(({ id, ...rest }) => (
                                <CommandPalette.ListItem
                                    key={id}
                                    index={getItemIndex(items, id)}
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
