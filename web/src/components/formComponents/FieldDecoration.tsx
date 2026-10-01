import type { AnyFieldApi } from "@tanstack/react-form"
import classNames from "classnames"
import type { ReactNode } from "react"

import FieldInfo from "@/components/formComponents/FieldInfo"

export interface FieldDecorationProps extends React.HTMLAttributes<HTMLDivElement> {
    readonly field: AnyFieldApi
    readonly label?: ReactNode
    readonly labelClassName?: string
}

export default function FieldDecoration({
    className,
    children,
    field,
    label,
    labelClassName,
    ...rest
}: FieldDecorationProps) {
    return (
        <section className={classNames("flex flex-col gap-sm", className)} {...rest}>
            <label
                htmlFor={field.name}
                className={classNames("text-sm font-medium", labelClassName)}
            >
                {label}
            </label>
            {children}
            <FieldInfo field={field} />
        </section>
    )
}
