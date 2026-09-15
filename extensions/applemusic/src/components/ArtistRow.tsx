import { CaretRightIcon } from "@phosphor-icons/react"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import ItemRow from "@/components/reusable/ItemRow"
import useNavigation from "@/hooks/navigationHook"
import type { ArtistResource } from "@/musickit/models/artist"

export interface ArtistRowProps {
    readonly artist: ArtistResource
}

export default function ArtistRow({ artist }: ArtistRowProps) {
    const navigation = useNavigation()
    const name = artist.attributes?.name
    return (
        <ItemRow
            leading={
                <ArtworkImage
                    className="h-10 aspect-square shrink-0"
                    shape="circle"
                    artwork={artist.attributes?.artwork}
                    itemTitle={name}
                />
            }
            title={name}
            subtitle={artist.attributes?.genreNames?.[0]}
            onClick={() => navigation.push({ kind: "artist", id: artist.id, name })}
            accessory={<CaretRightIcon className="shrink-0 text-gray-500" aria-hidden />}
        />
    )
}
