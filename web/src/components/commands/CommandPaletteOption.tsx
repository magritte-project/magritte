import { ComboboxOption } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import { getErrorMessage } from "@/utilities/errors"

export interface CommandPaletteOptionProps {
    readonly inputs: CommandInputs
    readonly command: Command
}

export default function CommandPaletteOption({ inputs, command }: CommandPaletteOptionProps) {
    const presentationQuery = useQuery({
        queryKey: ["commands", command.id],
        queryFn: () => command.present(inputs),
    })

    return (
        <ComboboxOption
            className="px-4 py-2 text-sm not-last:border-b border-separator data-focus:bg-key data-focus:text-on-key data-disabled:opacity-disabled"
            value={command}
            disabled={
                !inputs.hasAllOf(...command.requiredInputKinds) ||
                !presentationQuery.isSuccess ||
                presentationQuery.data.disabled
            }
        >
            {presentationQuery.isSuccess
                ? presentationQuery.data.displayName
                : presentationQuery.isError
                  ? getErrorMessage(presentationQuery.error)
                  : "…"}
        </ComboboxOption>
    )
}
