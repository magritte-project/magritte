import { useQuery, useQueryClient } from "@tanstack/react-query"

import { readCollectionTracks } from "@/api/queries/catalog"
import AddToLibraryButton from "@/components/AddToLibraryButton"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ItemRow from "@/components/reusable/ItemRow"
import useMusicKit from "@/hooks/musicKitHook"
import useNavigation from "@/hooks/navigationHook"
import {
    getCollectionCreator,
    getCollectionKind,
    type CollectionResource,
} from "@/musickit/models/collection"

export interface CollectionRowProps {
    readonly collection: CollectionResource
    /** Replaces the default subtitle of the album artist or playlist curator */
    readonly subtitle?: string
}

export default function CollectionRow({ collection, subtitle }: CollectionRowProps) {
    const musicKit = useMusicKit()
    const queryClient = useQueryClient()
    const navigation = useNavigation()

    const kind = getCollectionKind(collection)
    const name = collection.attributes?.name
    // Tracks are needed to know whether the collection is already in a library
    const tracksOptions = readCollectionTracks(musicKit, kind, collection.id)
    const tracksQuery = useQuery(tracksOptions)
    return (
        <ItemRow
            leading={
                <ArtworkImage
                    className="h-10 aspect-square shrink-0"
                    artwork={collection.attributes?.artwork}
                    itemTitle={name}
                />
            }
            title={name}
            subtitle={subtitle ?? getCollectionCreator(collection)}
            onClick={() =>
                navigation.push({
                    kind: "collection",
                    collectionKind: kind,
                    id: collection.id,
                    name,
                })
            }
            accessory={
                <AddToLibraryButton
                    songs={tracksQuery.data}
                    getSongs={() => queryClient.query(tracksOptions)}
                />
            }
        />
    )
}
