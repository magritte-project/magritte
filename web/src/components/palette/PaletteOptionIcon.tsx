import type { CommandIcon, CommandIconAppearance } from "@magritte/sdk"
import { GearIcon, type Icon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import classNames from "classnames"

import { fileAccessToken } from "@/api/queries/users"
import useAPI from "@/hooks/apiHook"
import { resolveResourceUrl } from "@/utilities/resources"

const APPEARANCES = {
    circle: {
        containerClassName: "rounded-full bg-key-subtle",
        overlayClassName: "rounded-full border border-black/10",
    },
    square: {
        containerClassName: "rounded-md bg-key-subtle",
        overlayClassName: "rounded-md border border-black/10",
    },
    plain: {
        containerClassName: "rounded-sm bg-key-subtle",
        overlayClassName: "",
    },
} satisfies Record<CommandIconAppearance, { containerClassName: string; overlayClassName: string }>

function isPhosphorIcon(icon: Icon | CommandIcon): icon is Icon {
    return "$$typeof" in icon
}

function getIconAppearance(icon?: Icon | CommandIcon): CommandIconAppearance {
    console.log(icon, typeof icon)
    if (!icon || isPhosphorIcon(icon)) {
        return "plain"
    } else {
        return icon.appearance
    }
}

export interface PaletteOptionIconProps extends React.HTMLAttributes<HTMLDivElement> {
    readonly icon?: Icon | CommandIcon
}

export default function PaletteOptionIcon({ icon, className, ...rest }: PaletteOptionIconProps) {
    const { containerClassName, overlayClassName } = APPEARANCES[getIconAppearance(icon)]
    const api = useAPI()
    const tokenQuery = useQuery(fileAccessToken(api))
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center overflow-clip text-on-primary",
                containerClassName,
                className,
            )}
            {...rest}
        >
            {tokenQuery.isSuccess && icon ? (
                isPhosphorIcon(icon) ? (
                    ((Icon) => <Icon size="60%" />)(icon)
                ) : (
                    <img
                        className="object-fit w-full h-full"
                        src={resolveResourceUrl(icon.url, tokenQuery.data)}
                        alt={icon.alt ?? "Icon"}
                        referrerPolicy="no-referrer"
                    />
                )
            ) : (
                <GearIcon size="60%" />
            )}
            <div
                className={classNames("absolute top-0 left-0 w-full h-full", overlayClassName)}
                aria-hidden
            />
        </div>
    )
}
