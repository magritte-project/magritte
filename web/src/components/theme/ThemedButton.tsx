import classNames from "classnames"
import type React from "react"

import { DefaultButtonComponent, type ButtonComponent } from "@/components/reusable/ButtonComponent"

export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly buttonComponent?: ButtonComponent
}

export default function ThemedButton({
    type = "submit",
    className,
    buttonComponent: Button = DefaultButtonComponent,
    ...rest
}: ThemedButtonProps) {
    return (
        <Button
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
