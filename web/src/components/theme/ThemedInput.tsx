import classNames from "classnames"
import type React from "react"

export type ThemedInputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function ThemedInput({ type = "text", className, ...rest }: ThemedInputProps) {
    return (
        <input
            type={type}
            className={classNames(
                "bg-secondary rounded-input p-md min-w-0 w-auto",
                "text-on-secondary placeholder:text-placeholder",
                "border border-outline focus:border-outline-focus outline-0",
                "disabled:opacity-70",
                className,
            )}
            {...rest}
        />
    )
}
