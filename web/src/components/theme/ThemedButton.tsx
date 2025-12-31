import classNames from "classnames"
import type { ReactNode } from "react"
import type React from "react"

export interface ThemedButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly buttonComponent?: (
        props: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ) => ReactNode
}

export default function ThemedButton({
    type = "submit",
    className,
    buttonComponent: ButtonComponent = (props) => <button {...props} />,
    ...rest
}: ThemedButtonProps) {
    return (
        <ButtonComponent
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
