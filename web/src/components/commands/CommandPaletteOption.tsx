import { ComboboxOption } from "@headlessui/react"
import { use, useMemo } from "react"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"

export interface CommandPaletteOptionProps {
    readonly inputs: CommandInputs
    readonly command: Command
}

export default function CommandPaletteOption({ inputs, command }: CommandPaletteOptionProps) {
    const presentationPromise = useMemo(() => command.present(inputs), [inputs, command])
    const presentation = use(presentationPromise)

    return (
        <ComboboxOption
            className="px-4 py-2 not-last:border-b border-gray-200 data-focus:bg-blue-100 data-disabled:opacity-50"
            value={command}
            disabled={presentation.disabled}
        >
            {presentation.displayName}
        </ComboboxOption>
    )
}
