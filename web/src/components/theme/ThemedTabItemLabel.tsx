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
                "flex flex-col md:flex-row items-center gap-sm px-lg py-sm",
                "group-first:rounded-l-button group-last:rounded-r-button",
                "not-group-last:border-r border-separator",
                "bg-secondary active:bg-secondary-active",
                "rounded data-[active=true]:text-key group-aria-disabled:opacity-disabled aria-disabled:opacity-disabled",
                className,
            )}
            data-active={isActive}
            {...rest}
        >
            <Icon className="text-[24px] md:text-[28px]" weight="light" />
            <span className="text-xs md:text-sm text-nowrap">{label}</span>
        </div>
    )
}
