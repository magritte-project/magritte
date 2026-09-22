import type { CommandIcon, CommandIconAppearance } from "@magritte/sdk"
import { GearIcon } from "@phosphor-icons/react"
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

export interface PaletteOptionIconProps extends React.HTMLAttributes<HTMLDivElement> {
    readonly icon?: CommandIcon
}

export default function PaletteOptionIcon({ icon, className, ...rest }: PaletteOptionIconProps) {
    const { containerClassName, overlayClassName } = APPEARANCES[icon?.appearance ?? "plain"]
    const api = useAPI()
    const tokenQuery = useQuery(fileAccessToken(api))
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center overflow-clip",
                containerClassName,
                className,
            )}
            {...rest}
        >
            {icon && tokenQuery.isSuccess ? (
                <img
                    className="object-fit w-full h-full"
                    src={resolveResourceUrl(icon.url, tokenQuery.data)}
                    alt={icon.alt ?? "Icon"}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <GearIcon size="50%" />
            )}
            <div
                className={classNames("absolute top-0 left-0 w-full h-full", overlayClassName)}
                aria-hidden
            />
        </div>
    )
}
