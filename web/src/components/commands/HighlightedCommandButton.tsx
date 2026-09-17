import { useQuery } from "@tanstack/react-query"
import classNames from "classnames"
import { useCallback } from "react"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import { getErrorMessage } from "@/utilities/errors"

export interface HighlightedCommandButtonProps {
    readonly inputs: CommandInputs
    readonly command: Command
    readonly onWillExecute?: () => void
}

export default function HighlightedCommandButton({
    inputs,
    command,
    onWillExecute,
}: HighlightedCommandButtonProps) {
    const presentationQuery = useQuery({
        queryKey: ["commands", command.id],
        queryFn: () => command.present(inputs),
    })
    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault()
            event.stopPropagation()
            onWillExecute?.()
            command.execute(inputs)
        },
        [onWillExecute, inputs, command],
    )

    return (
        <button
            type="button"
            className={classNames(
                "px-3 py-2 flex items-center gap-0.5",
                "whitespace-nowrap font-bold text-xs",
                "rounded-full bg-tertiary active:bg-tertiary-active",
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
