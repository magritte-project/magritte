import type { Icon } from "@phosphor-icons/react"
import classNames from "classnames"
import type { ReactNode } from "react"

export interface ThemedTabItemLabelProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "children"
> {
    readonly isActive: boolean
    readonly icon: Icon
    readonly label: ReactNode
}

export default function ThemedTabItemLabel({
    className,
    isActive,
    icon: Icon,
    label,
    ...rest
}: ThemedTabItemLabelProps) {
    return (
        <div
            className={classNames(
                "flex items-center gap-1 px-3 py-1",
                "group-first:rounded-l-full group-last:rounded-r-full",
                "not-group-last:border-r border-gray-100",
                "bg-gray-50 active:bg-gray-100 disabled:bg-transparent",
                "rounded data-[active=true]:text-blue-500 active:bg-gray-100",
                className,
            )}
            data-active={isActive}
            {...rest}
        >
            <Icon size="2em" weight="light" />
            <span className="text-nowrap">{label}</span>
        </div>
    )
}
