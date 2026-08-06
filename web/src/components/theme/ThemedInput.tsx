import classNames from "classnames"
import type React from "react"

export type ThemedInputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function ThemedInput({ type = "text", className, ...rest }: ThemedInputProps) {
    return (
        <input
            type={type}
            className={classNames(
                "bg-primary rounded-lg p-2 min-w-0 w-auto",
                "text-on-primary placeholder:text-placeholder",
                "border border-outline focus:border-outline-focus outline-0",
                {
                    "rounded-full! px-3!": type === "search",
                },
                className,
            )}
            {...rest}
        />
    )
}
