import type { PlayableItemArtwork } from "@magritte/sdk"
import classNames from "classnames"
import type React from "react"
import { use } from "react"

import useAPI from "@/hooks/apiHook"
import { resolveUrl } from "@/utilities/resources"

export interface ArtworkImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly artworks?: readonly PlayableItemArtwork[]
    readonly itemTitle?: string | null
    readonly accessory?: React.ReactNode
}

export default function ArtworkImage({
    className,
    artworks,
    itemTitle,
    accessory,
    ...rest
}: ArtworkImageProps) {
    // TODO: Fix up session token and URL building...
    const { fileAccess } = useAPI()
    const token = use(fileAccess.token())
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center rounded-md overflow-clip bg-blue-200",
                className,
            )}
            {...rest}
        >
            {!!artworks?.length && (
                <img
                    className="object-fit w-full h-full"
                    src={resolveUrl(artworks[0].image_url, token)}
                    alt={`Cover for ${itemTitle}`}
                />
            )}
            <div
                className="absolute top-0 left-0 w-full h-full rounded-md border border-black/10"
                aria-hidden
            />
            {accessory}
        </div>
    )
}
