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
                "bg-gradient-to-b from-slate-900 to-slate-950 active:from-slate-950",
                "border border-black focus:border-blue-500 outline-0",
                "text-slate-50 active:text-white disabled:text-slate-50/50 font-bold",
                "px-4 py-2 rounded-full",
                className,
            )}
            {...rest}
        />
    )
}
