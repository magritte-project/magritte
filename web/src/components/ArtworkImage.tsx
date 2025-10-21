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
                "flex items-center justify-center bg-blue-200",
                className,
            )}
            {...rest}
        >
            {artworks?.length && (
                <img
                    src={`/api/artworks/${artworks[0].id}/image?token=${userSession.current?.accessToken ?? ""}`}
                    alt={`Cover for ${itemTitle}`}
                />
            )}
        </div>
    )
}
