import { WarningCircleIcon } from "@phosphor-icons/react"
import type { AnyFieldApi } from "@tanstack/react-form"

import { getErrorMessage } from "@/utilities/errors"

export interface FieldInfoProps {
    readonly field: AnyFieldApi
}

export default function FieldInfo({ field }: FieldInfoProps) {
    const errors = field.state.meta.errors
    if (errors.length === 0) {
        return null
    }
    return (
        <ol className="flex flex-col gap-0.5 text-xs text-red-600">
            {errors.map((error, index) => (
                <li key={`errors[${index}]`} className="flex items-center gap-1">
                    <WarningCircleIcon size="1.2em" weight="bold" /> {getErrorMessage(error)}
                </li>
            ))}
        </ol>
    )
}
