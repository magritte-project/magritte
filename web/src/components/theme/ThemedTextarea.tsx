import type React from "react"

import classNames from "classnames"

export type ThemedTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function ThemedTextarea({ className, ...rest }: ThemedTextareaProps) {
    return (
        <textarea
            className={classNames(
                "bg-white rounded-sm p-2 min-w-0 w-auto",
                "text-gray-950 placeholder:text-black/40",
                "border border-gray-300 focus:border-blue-500 outline-0",
                className,
            )}
            {...rest}
        />
    )
}
