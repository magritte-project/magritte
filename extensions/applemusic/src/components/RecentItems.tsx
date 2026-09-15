import { useQuery } from "@tanstack/react-query"

import { getRecentTitle, readRecent, type RecentKind } from "@/api/queries/recent"
import CollectionRow from "@/components/CollectionRow"
import ListSection from "@/components/reusable/ListSection"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import useMusicKit from "@/hooks/musicKitHook"
import useNavigation from "@/hooks/navigationHook"
import {
    getCollectionCreator,
    getCollectionKind,
    getCollectionKindLabel,
} from "@/musickit/models/collection"
import { joinDetails } from "@/utilities/format"

export interface RecentItemsProps {
    readonly kind: RecentKind
    /** Show at most this many items, with a "See All" action to reveal the rest */
    readonly limit?: number
}

export default function RecentItems({ kind, limit }: RecentItemsProps) {
    const musicKit = useMusicKit()
    const navigation = useNavigation()
    const recentQuery = useQuery(readRecent(musicKit, kind))

    const items = recentQuery.data ?? []
    const isPreview = limit !== undefined
    const visibleItems = isPreview ? items.slice(0, limit) : items
    return (
        <ListSection
            // The full list already shows the title in the header
            title={isPreview ? getRecentTitle(kind) : undefined}
            action={
                isPreview &&
                items.length > limit && (
                    <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline"
                        onClick={() => navigation.push({ kind: "recent", recent: kind })}
                    >
                        See All
                    </button>
                )
            }
        >
            {recentQuery.isPending && (
                <li>
                    <ContentUnavailable variant="inline" />
                </li>
            )}
            {recentQuery.isError && (
                <li>
                    <ContentUnavailable variant="inline" error={recentQuery.error} />
                </li>
            )}
            {recentQuery.isSuccess && items.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">Nothing here yet</li>
            )}
            {visibleItems.map((item, index) => (
                <CollectionRow
                    key={`recent[${item.type}/${item.id}@${index}]`}
                    collection={item}
                    subtitle={joinDetails(
                        getCollectionKindLabel(getCollectionKind(item)),
                        getCollectionCreator(item),
                    )}
                />
            ))}
        </ListSection>
    )
}
