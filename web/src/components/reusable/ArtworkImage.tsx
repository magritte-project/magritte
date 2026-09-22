import type { PlayableItemArtwork } from "@magritte/sdk"
import { useQuery } from "@tanstack/react-query"
import classNames from "classnames"
import type React from "react"

import { fileAccessToken } from "@/api/queries/users"
import useAPI from "@/hooks/apiHook"
import { resolveResourceUrl } from "@/utilities/resources"

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
    const api = useAPI()
    const tokenQuery = useQuery(fileAccessToken(api))
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center rounded-md overflow-clip bg-key-subtle",
                className,
            )}
            {...rest}
        >
            {!!artworks?.length && tokenQuery.isSuccess && (
                <img
                    className="object-fit w-full h-full"
                    src={resolveResourceUrl(artworks[0].image_url, tokenQuery.data)}
                    alt={`Cover for ${itemTitle}`}
                    referrerPolicy="no-referrer"
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
