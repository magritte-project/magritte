import type React from "react"

import classNames from "classnames"

export type ThemedInputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function ThemedInput({ type = "text", className, ...rest }: ThemedInputProps) {
    return (
        <input
            type={type}
            className={classNames(
                "bg-white rounded-md p-2",
                "text-gray-950 placeholder:text-black/40",
                "border-2 border-gray-300 focus:border-blue-500 outline-0",
                className,
            )}
            {...rest}
        />
    )
}
