import classNames from "classnames"
import type React from "react"

export type ThemedTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function ThemedTextarea({ className, ...rest }: ThemedTextareaProps) {
    return (
        <textarea
            className={classNames(
                "bg-secondary rounded-input p-md min-w-0 w-auto",
                "text-on-secondary placeholder:text-placeholder",
                "border border-outline focus:border-outline-focus outline-0",
                className,
            )}
            {...rest}
        />
    )
}
