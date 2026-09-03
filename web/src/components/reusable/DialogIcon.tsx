import type { DialogType } from "@magritte/sdk"
import {
    BugIcon,
    ChatTeardropIcon,
    WarningCircleIcon,
    type Icon,
    type IconProps,
} from "@phosphor-icons/react"

const ICONS = {
    info: {
        icon: ChatTeardropIcon,
        label: "Notice",
    },
    warning: {
        icon: WarningCircleIcon,
        label: "Warning",
    },
    error: {
        icon: BugIcon,
        label: "Error",
    },
} satisfies Record<DialogType, { icon: Icon; label: string }>

export interface DialogIconProps extends IconProps {
    readonly type: DialogType
}

export default function DialogIcon({ type, ...rest }: DialogIconProps) {
    const { icon: Icon, label } = ICONS[type]
    return <Icon {...rest} aria-label={label} />
}
