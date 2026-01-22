import type React from "react"

import { useCallback } from "react"

import type { ThemedTextareaProps } from "@/components/theme/ThemedTextarea"

import ThemedTextarea from "@/components/theme/ThemedTextarea"
import { useFieldContext } from "@/contexts/formContext"

export interface TextareaFieldProps extends Omit<
    ThemedTextareaProps,
    "value" | "defaultValue" | "onChange" | "onBlur" | "name"
> {}

export default function TextareaField({ id, ...rest }: TextareaFieldProps) {
    const field = useFieldContext<React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]>()
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            field.handleChange(event.currentTarget.value)
        },
        [field],
    )
    return (
        <ThemedTextarea
            id={id ?? field.name}
            value={field.state.value}
            name={field.name}
            onChange={handleChange}
            onBlur={field.handleBlur}
            {...rest}
        />
    )
}
