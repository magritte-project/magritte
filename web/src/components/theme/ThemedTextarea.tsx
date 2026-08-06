import classNames from "classnames"
import type React from "react"

export type ThemedTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function ThemedTextarea({ className, ...rest }: ThemedTextareaProps) {
    return (
        <textarea
            className={classNames(
                "bg-primary rounded-sm p-2 min-w-0 w-auto",
                "text-on-primary placeholder:text-placeholder",
                "border border-outline focus:border-outline-focus outline-0",
                className,
            )}
            {...rest}
        />
    )
}
