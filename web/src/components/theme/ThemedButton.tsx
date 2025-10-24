import classNames from "classnames"
import type React from "react"

export type ThemedButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export default function ThemedButton({
    type = "submit",
    className,
    ...rest
}: ThemedButtonProps) {
    return (
        <button
            type={type}
            className={classNames(
                "bg-blue-500 active:bg-blue-400 disabled:bg-blue-200",
                "text-slate-50 active:text-white font-bold",
                "px-4 py-2 rounded-full",
                className,
            )}
            {...rest}
        />
    )
}
