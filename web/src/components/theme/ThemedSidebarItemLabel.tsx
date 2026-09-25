import type { Icon } from "@phosphor-icons/react"
import classNames from "classnames"
import type { ReactNode } from "react"

export interface ThemedSidebarItemLabelProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "children"
> {
    readonly isActive: boolean
    readonly icon: Icon
    readonly label: ReactNode
}

export default function ThemedSidebarItemLabel({
    className,
    isActive,
    icon: Icon,
    label,
    ...rest
}: ThemedSidebarItemLabelProps) {
    return (
        <div
            className={classNames(
                "flex items-center gap-between p-1",
                "hover:bg-tertiary active:bg-tertiary-active rounded-md",
                "data-[active=true]:text-key group-aria-disabled:opacity-disabled aria-disabled:opacity-disabled",
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
