import classNames from "classnames"
import type React from "react"

import { DefaultButtonComponent, type ButtonComponent } from "@/components/reusable/ButtonComponent"

export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly buttonComponent?: ButtonComponent
    readonly destructive?: boolean
}

export default function ThemedButton({
    type = "submit",
    className,
    buttonComponent: Button = DefaultButtonComponent,
    destructive,
    ...rest
}: ThemedButtonProps) {
    return (
        <Button
            type={type}
            className={classNames(
                "disabled:opacity-disabled",
                "text-on-key active:text-on-key-active font-bold",
                "px-4 py-2 rounded-full",
                {
                    "bg-key active:bg-key-active": !destructive,
                    "bg-destructive active:bg-destructive-active": destructive,
                },
                className,
            )}
            {...rest}
        />
    )
}
