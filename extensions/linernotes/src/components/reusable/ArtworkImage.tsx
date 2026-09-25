import { MusicNoteIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export interface ArtworkImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly imageUrl?: string
    readonly itemTitle?: string | null
    /** Called when the image could not be loaded, e.g. when there is no cover art */
    readonly onImageError?: () => void
}

export default function ArtworkImage({
    className,
    imageUrl,
    itemTitle,
    onImageError,
    ...rest
}: ArtworkImageProps) {
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center overflow-clip rounded-md bg-indigo-100 text-indigo-300",
                className,
            )}
            {...rest}
        >
            {imageUrl ? (
                <img
                    className="h-full w-full object-cover"
                    src={imageUrl}
                    alt={`Cover for ${itemTitle}`}
                    loading="lazy"
                    onError={onImageError}
                />
            ) : (
                <MusicNoteIcon aria-hidden />
            )}
            <div
                className="absolute top-0 left-0 h-full w-full rounded-md border border-black/10"
                aria-hidden
            />
        </div>
    )
}
