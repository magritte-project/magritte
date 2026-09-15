import classNames from "classnames"

import type { MusicArtwork } from "@/musickit/models/base"
import { formatArtworkUrl } from "@/utilities/artwork"

export interface ArtworkImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly artwork?: MusicArtwork
    readonly itemTitle?: string | null
    /** Artists use circular artwork, everything else is square */
    readonly shape?: "square" | "circle"
}

export default function ArtworkImage({
    className,
    artwork,
    itemTitle,
    shape = "square",
    ...rest
}: ArtworkImageProps) {
    const roundedClassName = shape === "circle" ? "rounded-full" : "rounded-md"
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center overflow-clip bg-red-200",
                roundedClassName,
                className,
            )}
            {...rest}
        >
            {artwork && (
                <img
                    className="object-cover w-full h-full"
                    src={formatArtworkUrl(artwork, 256)}
                    alt={`Cover for ${itemTitle}`}
                />
            )}
            <div
                className={classNames(
                    "absolute top-0 left-0 w-full h-full border border-black/10",
                    roundedClassName,
                )}
                aria-hidden
            />
        </div>
    )
}
