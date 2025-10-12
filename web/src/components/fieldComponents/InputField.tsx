import { useFieldContext } from "@/contexts/formContext"
import classNames from "classnames"
import type React from "react"
import { useCallback } from "react"

export interface InputFieldProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "value" | "defaultValue" | "onChange" | "onBlur" | "name"
    > {}

export default function InputField({
    type = "text",
    id,
    className,
    ...rest
}: InputFieldProps) {
    const field =
        useFieldContext<React.InputHTMLAttributes<HTMLInputElement>["value"]>()
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            field.handleChange(event.currentTarget.value)
        },
        [field],
    )
    const inputClasses = classNames(
        "bg-slate-800 rounded-md p-1",
        "text-white placeholder:text-white/40",
        "border-2 border-slate-900 focus:border-blue-500 outline-0",
        className,
    )
    return (
        <input
            type={type}
            id={id ?? field.name}
            className={inputClasses}
            value={field.state.value}
            name={field.name}
            onChange={handleChange}
            onBlur={field.handleBlur}
            {...rest}
        />
    )
}
