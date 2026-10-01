import classNames from "classnames"
import type React from "react"

import { DefaultButtonComponent, type ButtonComponent } from "@/components/reusable/ButtonComponent"

export interface ThemedSubtleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly buttonComponent?: ButtonComponent
}

export default function ThemedSubtleButton({
    type = "submit",
    className,
    buttonComponent: Button = DefaultButtonComponent,
    ...rest
}: ThemedSubtleButtonProps) {
    return (
        <Button
            type={type}
            className={classNames(
                "px-3 py-2 flex items-center gap-0.5",
                "rounded-button bg-secondary active:bg-secondary-active data-open:bg-secondary-active",
                "font-bold disabled:opacity-disabled drop-shadow-xs",
                className,
            )}
            {...rest}
        />
    )
}
