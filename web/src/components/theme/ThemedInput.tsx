import type React from "react"

import classNames from "classnames"

export type ThemedInputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function ThemedInput({ type = "text", className, ...rest }: ThemedInputProps) {
    return (
        <input
            type={type}
            className={classNames(
                "bg-white rounded-lg p-2 min-w-0 w-auto",
                "text-gray-950 placeholder:text-black/40",
                "border border-gray-300 focus:border-blue-500 outline-0",
                {
                    "rounded-full! px-3!": type === "search",
                },
                className,
            )}
            {...rest}
        />
    )
}
