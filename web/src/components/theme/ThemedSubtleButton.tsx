import classNames from "classnames"
import type { ReactNode } from "react"
import type React from "react"

export interface ThemedSubtleButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly buttonComponent?: (
        props: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ) => ReactNode
}

export default function ThemedSubtleButton({
    type = "submit",
    className,
    buttonComponent: ButtonComponent = (props) => <button {...props} />,
    ...rest
}: ThemedSubtleButtonProps) {
    return (
        <ButtonComponent
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
