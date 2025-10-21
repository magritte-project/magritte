import type { Icon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

export interface ThemedTabItemLabelProps {
    readonly isActive: boolean
    readonly icon: Icon
    readonly label: ReactNode
}

export default function ThemedTabItemLabel({
    isActive,
    icon: Icon,
    label,
}: ThemedTabItemLabelProps) {
    return (
        <div
            className="flex flex-col items-center gap-1 p-1 rounded data-[active=true]:text-blue-500 active:bg-gray-100"
            data-active={isActive}
        >
            <Icon size="2em" weight="light" />
            {label}
        </div>
    )
}
