import classNames from "classnames"

export type ThemedSidebarSectionHeaderProps = React.HTMLAttributes<HTMLHeadingElement>

export default function ThemedSidebarSectionHeader({
    className,
    ...rest
}: ThemedSidebarSectionHeaderProps) {
    return <h3 className={classNames("text-xs font-bold uppercase mb-1", className)} {...rest} />
}
