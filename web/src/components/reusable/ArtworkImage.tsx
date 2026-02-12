import type React from "react"

import classNames from "classnames"

import type { PlayableItemArtwork } from "@/playback/item"

import useUserSession from "@/hooks/userSessionHook"
import { resolveUrl } from "@/utilities/resources"

const VARIANTS = {
    fancy: {
        containerClassName: "rounded-md bg-blue-200",
        overlayClassName: "rounded-md border border-black/10",
    },
    plain: {
        containerClassName: "",
        overlayClassName: "",
    },
} as const

export type ArtworkImageVariant = keyof typeof VARIANTS

export interface ArtworkImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly variant?: ArtworkImageVariant
    readonly artworks?: readonly PlayableItemArtwork[]
    readonly itemTitle?: string | null
}

export default function ArtworkImage({
    className,
    variant = "fancy",
    artworks,
    itemTitle,
    ...rest
}: ArtworkImageProps) {
    const userSession = useUserSession()
    const { containerClassName, overlayClassName } = VARIANTS[variant]
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center overflow-clip",
                containerClassName,
                className,
            )}
            {...rest}
        >
            {!!artworks?.length && (
                <img
                    className="object-fit w-full h-full"
                    src={resolveUrl(artworks[0].image_url, userSession.current)}
                    alt={`Cover for ${itemTitle}`}
                />
            )}
            <div
                className={classNames("absolute top-0 left-0 w-full h-full", overlayClassName)}
                aria-hidden
            />
        </div>
    )
}
