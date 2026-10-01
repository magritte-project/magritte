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
                "group-first:rounded-l-button group-last:rounded-r-button",
                "not-group-last:border-r border-separator",
                "bg-secondary active:bg-secondary-active",
                "rounded data-[active=true]:text-key group-aria-disabled:opacity-disabled aria-disabled:opacity-disabled",
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
