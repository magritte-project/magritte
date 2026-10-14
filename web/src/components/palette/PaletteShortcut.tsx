import { useQuery } from "@tanstack/react-query"
import classNames from "classnames"
import { useCallback } from "react"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import { getErrorMessage } from "@/utilities/errors"

export interface PaletteShortcutProps {
    readonly inputs: CommandInputs
    readonly command: Command
    readonly onWillExecute?: () => void
}

export default function PaletteShortcut({ inputs, command, onWillExecute }: PaletteShortcutProps) {
    const presentationQuery = useQuery({
        queryKey: ["commands", command.id],
        queryFn: () => command.present(inputs),
    })
    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault()
            event.stopPropagation()
            onWillExecute?.()
            void command.execute(inputs)
        },
        [onWillExecute, inputs, command],
    )

    return (
        <button
            type="button"
            className={classNames(
                "px-lg py-md flex items-center gap-xs",
                "whitespace-nowrap font-bold text-xs",
                "rounded-button bg-tertiary active:bg-tertiary-active",
                "disabled:opacity-disabled drop-shadow-xs",
            )}
            disabled={
                !inputs.hasAllOf(...command.requiredInputKinds) ||
                !presentationQuery.isSuccess ||
                presentationQuery.data.disabled
            }
            onClick={handleClick}
        >
            {presentationQuery.isSuccess
                ? presentationQuery.data.displayName
                : presentationQuery.isError
                  ? getErrorMessage(presentationQuery.error)
                  : "…"}
        </button>
    )
}
