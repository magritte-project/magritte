import type { MusicArtwork } from "@/musickit/models/base"

import ArtworkImage from "@/components/ArtworkImage"

export interface SearchResultLabelProps {
    readonly artworks?: readonly MusicArtwork[]
    readonly title?: string | null
    readonly creator?: string | null
    readonly collection?: string | null
}

export default function SearchResultLabel({
    artworks,
    title,
    creator,
    collection,
}: SearchResultLabelProps) {
    return (
        <div className="flex-1 flex items-center gap-2 text-start">
            <ArtworkImage
                className="h-8 aspect-square shrink-0"
                artworks={artworks}
                itemTitle={title}
            />
            <div className="flex-1 flex flex-col">
                <div className="font-bold text-sm">{title ?? "--"}</div>
                <div className="text-gray-700 text-xs">
                    {collection ?? "--"} by {creator ?? "--"}
                </div>
            </div>
        </div>
    )
}
