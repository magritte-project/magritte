import { ComboboxOption } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import PaletteOptionIcon from "@/components/palette/PaletteOptionIcon"
import { getErrorMessage } from "@/utilities/errors"

export interface PaletteCommandOptionProps {
    readonly inputs: CommandInputs
    readonly command: Command
}

export default function PaletteCommandOption({ inputs, command }: PaletteCommandOptionProps) {
    const presentationQuery = useQuery({
        queryKey: ["commands", "presentation", command.id],
        queryFn: () => command.present(inputs),
    })

    return (
        <ComboboxOption
            className="px-xl py-md text-sm not-last:border-b border-separator data-focus:bg-key data-focus:text-on-key data-disabled:opacity-disabled"
            value={command}
            disabled={
                !inputs.hasAllOf(...command.requiredInputKinds) ||
                !presentationQuery.isSuccess ||
                presentationQuery.data.disabled
            }
        >
            <div className="flex items-center gap-lg">
                <PaletteOptionIcon className="w-8 h-8" icon={presentationQuery.data?.icon} />
                <div className="text-medium">
                    {presentationQuery.isSuccess
                        ? presentationQuery.data.displayName
                        : presentationQuery.isError
                          ? getErrorMessage(presentationQuery.error)
                          : "…"}
                </div>
            </div>
        </ComboboxOption>
    )
}
