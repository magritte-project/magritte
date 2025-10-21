import type { ArtworkRead } from "@/api/openapi"
import useUserSession from "@/hooks/userSessionHook"
import classNames from "classnames"
import type React from "react"

export interface ArtworkImageProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    readonly artworks?: readonly ArtworkRead[]
    readonly itemTitle?: string | null
}

export default function ArtworkImage({
    className,
    artworks,
    itemTitle,
    ...rest
}: ArtworkImageProps) {
    // TODO: Fix up session token and URL building...
    const userSession = useUserSession()
    return (
        <div
            className={classNames(
                "relative flex items-center justify-center rounded-md overflow-clip bg-blue-200",
                className,
            )}
            {...rest}
        >
            {artworks?.length && (
                <img
                    className="object-fit w-full h-full"
                    src={`/api/artworks/${artworks[0].id}/image?token=${userSession.current?.accessToken ?? ""}`}
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
