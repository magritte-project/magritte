import { useCallback, type ChangeEvent, type ReactNode } from "react"

import type { ThemedSelectOptions } from "@/components/theme/ThemedSelect"
import ThemedSelect from "@/components/theme/ThemedSelect"
import { useFieldContext } from "@/contexts/formContext"

export interface SelectFieldOption<TValue extends string> {
    readonly value: TValue | undefined
    readonly label: ReactNode
    readonly disabled?: boolean
}

export interface SelectFieldProps<TValue extends string> extends Omit<
    ThemedSelectOptions,
    "id" | "name" | "value" | "onChange" | "children"
> {
    readonly options: Iterable<SelectFieldOption<TValue>>
}

export default function SelectField<TValue extends string>({
    options,
    ...rest
}: SelectFieldProps<TValue>) {
    const field = useFieldContext<string | null | undefined>()
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            field.handleChange(event.currentTarget.value)
        },
        [field],
    )
    return (
        <ThemedSelect
            id={field.name}
            name={field.name}
            value={field.state.value ?? undefined}
            onChange={handleChange}
            {...rest}
        >
            {Array.from(options, (option) => (
                <option
                    key={`${field.name}.options[${option.value}]`}
                    value={option.value}
                    disabled={option.disabled}
                >
                    {option.label}
                </option>
            ))}
        </ThemedSelect>
    )
}
