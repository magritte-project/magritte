import classNames from "classnames"

import type { MusicArtwork } from "@/musickit/models/base"

export interface ArtworkImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly artworks?: readonly MusicArtwork[]
    readonly itemTitle?: string | null
}

export default function ArtworkImage({
    className,
    artworks,
    itemTitle,
    ...rest
}: ArtworkImageProps) {
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center rounded-md overflow-clip bg-red-200",
                className,
            )}
            {...rest}
        >
            {!!artworks?.length && (
                <img
                    className="object-fit w-full h-full"
                    src={artworks[0].url
                        .replace("{w}", String(Math.min(256, artworks[0].width)))
                        .replace("{h}", String(Math.min(256, artworks[0].height)))}
                    alt={`Cover for ${itemTitle}`}
                />
            )}
            <div
                className="absolute top-0 left-0 w-full h-full rounded-md border border-black/10"
                aria-hidden
            />
        </div>
    )
}
