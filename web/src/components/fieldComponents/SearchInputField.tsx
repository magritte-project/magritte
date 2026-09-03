import type React from "react"
import { useCallback } from "react"

import type { ThemedInputSearchProps } from "@/components/theme/ThemedSearchInput"
import ThemedSearchInput from "@/components/theme/ThemedSearchInput"
import { useFieldContext } from "@/contexts/formContext"

export interface SearchInputFieldProps extends Omit<
    ThemedInputSearchProps,
    "value" | "defaultValue" | "onChange" | "onBlur" | "name"
> {}

export default function SearchInputField({ id, ...rest }: SearchInputFieldProps) {
    const field = useFieldContext<React.InputHTMLAttributes<HTMLInputElement>["value"]>()
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            field.handleChange(event.currentTarget.value)
        },
        [field],
    )
    return (
        <ThemedSearchInput
            id={id ?? field.name}
            value={field.state.value}
            name={field.name}
            onChange={handleChange}
            onBlur={field.handleBlur}
            {...rest}
        />
    )
}
