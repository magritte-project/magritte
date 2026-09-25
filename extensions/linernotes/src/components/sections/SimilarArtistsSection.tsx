import { ArrowSquareOutIcon } from "@phosphor-icons/react"

import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"

export interface SimilarArtistsSectionProps {
    readonly similar: readonly { readonly name: string; readonly url: string }[]
}

/** Last.fm's similar artists, which have no MusicBrainz ids so they open on Last.fm */
export default function SimilarArtistsSection({ similar }: SimilarArtistsSectionProps) {
    if (similar.length === 0) {
        return null
    }
    return (
        <ListSection title="Similar artists">
            {similar.slice(0, 5).map((artist) => (
                <ItemRow
                    key={artist.name}
                    title={artist.name}
                    accessory={<ArrowSquareOutIcon className="text-gray-500" aria-hidden />}
                    onClick={
                        artist.url
                            ? () => globalThis.open(artist.url, "_blank", "noopener")
                            : undefined
                    }
                />
            ))}
        </ListSection>
    )
}
