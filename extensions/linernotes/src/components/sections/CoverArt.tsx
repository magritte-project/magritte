import { useState } from "react"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import { coverArtUrl, type CoverArtSize } from "@/musicbrainz/coverArt"

export interface CoverArtProps {
    readonly entity?: { readonly kind: "release" | "release-group"; readonly id: string }
    /** What to show when the archive has no art, e.g. the host's own artwork */
    readonly fallbackUrl?: string
    readonly itemTitle?: string | null
    readonly size?: CoverArtSize
    readonly className?: string
}

/** Art from the Cover Art Archive, which has none for many releases */
export default function CoverArt({
    entity,
    fallbackUrl,
    itemTitle,
    size = 250,
    className,
}: CoverArtProps) {
    const [failedId, setFailedId] = useState<string | null>(null)
    const useArchive = entity !== undefined && failedId !== entity.id
    return (
        <ArtworkImage
            className={className}
            imageUrl={useArchive ? coverArtUrl(entity, size) : fallbackUrl}
            itemTitle={itemTitle}
            onImageError={useArchive ? () => setFailedId(entity.id) : undefined}
        />
    )
}
