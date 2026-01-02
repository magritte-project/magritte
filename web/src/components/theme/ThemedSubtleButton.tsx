import type React from "react"

import classNames from "classnames"

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
                "rounded-full bg-gray-50 active:bg-gray-100 data-open:bg-gray-200 disabled:bg-transparent",
                "font-bold disabled:text-gray-300",
                className,
            )}
            {...rest}
        />
    )
}
