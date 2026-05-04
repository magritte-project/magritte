import { useEffect, useState } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"
import useNowPlaying from "@/hooks/nowPlayingHook"

export default function Artwork() {
    const extensionHost = useExtensionHost()
    const { item } = useNowPlaying()
    const [src, setSrc] = useState<string | undefined>(undefined)
    useEffect(() => {
        ;(async () => {
            const firstArtwork = item?.artworks?.[0]
            if (firstArtwork) {
                const library = await extensionHost.library()
                const imageUrl = await library.resolveArtworkImageUrl(firstArtwork.image_url)
                setSrc(imageUrl)
            }
        })()
    }, [extensionHost, item])
    return (
        <div className="relative flex items-center justify-center rounded-md overflow-clip bg-blue-200 w-full aspect-square">
            {src && (
                <img
                    className="object-fit w-full h-full"
                    src={src}
                    alt={`Cover for ${item.title}`}
                />
            )}
            <div
                className="absolute top-0 left-0 w-full h-full rounded-md border border-black/10"
                aria-hidden
            />
        </div>
    )
}
