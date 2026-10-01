import { Fragment } from "react/jsx-runtime"

import PaletteCommandOption from "@/components/palette/PaletteCommandOption"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommands from "@/hooks/commandsHook"

export interface PaletteCommandsViewProps {
    readonly search: string
}

export default function PaletteCommandsView({ search }: PaletteCommandsViewProps) {
    const inputs = useCommandInputs()
    const commands = useCommands({ search })

    return (
        <Fragment key="paletteCommandResults">
            {commands.length === 0 ? (
                <p className="px-xl py-8 text-center text-sm text-on-secondary">
                    No commands found
                </p>
            ) : (
                commands.map((command) => (
                    <PaletteCommandOption key={command.id} inputs={inputs} command={command} />
                ))
            )}
        </Fragment>
    )
}
