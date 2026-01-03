import type React from "react"

import { useCallback } from "react"

import type { ThemedInputProps } from "@/components/theme/ThemedInput"

import FieldInfo from "@/components/formComponents/FieldInfo"
import ThemedInput from "@/components/theme/ThemedInput"
import { useFieldContext } from "@/contexts/formContext"

export interface InputFieldProps extends Omit<
    ThemedInputProps,
    "value" | "defaultValue" | "onChange" | "onBlur" | "name"
> {}

export default function InputField({ id, ...rest }: InputFieldProps) {
    const field = useFieldContext<React.InputHTMLAttributes<HTMLInputElement>["value"]>()
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            field.handleChange(event.currentTarget.value)
        },
        [field],
    )
    return (
        <>
            <ThemedInput
                id={id ?? field.name}
                value={field.state.value}
                name={field.name}
                onChange={handleChange}
                onBlur={field.handleBlur}
                {...rest}
            />
            <FieldInfo field={field} />
        </>
    )
}
