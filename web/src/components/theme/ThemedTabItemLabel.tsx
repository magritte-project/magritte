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
    readonly alwaysInline?: boolean
    readonly alwaysShowLabel?: boolean
}

export default function ThemedTabItemLabel({
    className,
    isActive,
    icon: Icon,
    label,
    alwaysInline = true,
    alwaysShowLabel = true,
    ...rest
}: ThemedTabItemLabelProps) {
    return (
        <div
            className={classNames(
                "flex items-center gap-sm px-lg py-sm",
                "group-first:rounded-l-button group-last:rounded-r-button",
                "not-group-last:border-r border-separator",
                "bg-secondary active:bg-secondary-active",
                "rounded data-[active=true]:text-key group-aria-disabled:opacity-disabled aria-disabled:opacity-disabled",
                { "flex-col md:flex-row": !alwaysInline },
                className,
            )}
            data-active={isActive}
            title={typeof label === "string" ? label : undefined}
            {...rest}
        >
            <Icon
                className={classNames({
                    "text-[24px] md:text-[28px]": !alwaysInline,
                    "text-[28px]": alwaysInline,
                })}
                weight="light"
            />
            <span
                className={classNames("text-nowrap", {
                    "text-xs md:text-sm": !alwaysInline,
                    "text-sm": alwaysInline,
                    "hidden md:inline": !alwaysShowLabel,
                })}
            >
                {label}
            </span>
        </div>
    )
}
