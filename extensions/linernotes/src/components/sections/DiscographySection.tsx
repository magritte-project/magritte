import { useState } from "react"

import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import CoverArt from "@/components/sections/CoverArt"
import SectionState from "@/components/structure/SectionState"
import useNavigation from "@/hooks/navigationHook"
import type { ReleaseGroupSummary } from "@/model/types"
import { formatYear, joinDetails } from "@/utilities/format"

export interface DiscographySectionProps {
    readonly releaseGroups: readonly ReleaseGroupSummary[] | undefined
    readonly isPending: boolean
    readonly error?: unknown
}

interface Shelf {
    readonly title: string
    readonly releaseGroups: readonly ReleaseGroupSummary[]
}

function byDate(a: ReleaseGroupSummary, b: ReleaseGroupSummary): number {
    return (a.firstReleaseDate ?? "9999").localeCompare(b.firstReleaseDate ?? "9999")
}

/** Studio albums and EPs on their own, everything else (live, compilations...) together */
function shelve(releaseGroups: readonly ReleaseGroupSummary[]): readonly Shelf[] {
    const isPlain = (group: ReleaseGroupSummary) => group.secondaryTypes.length === 0
    const albums = releaseGroups.filter((group) => group.primaryType === "Album" && isPlain(group))
    const eps = releaseGroups.filter((group) => group.primaryType === "EP" && isPlain(group))
    const other = releaseGroups.filter((group) => !albums.includes(group) && !eps.includes(group))
    return [
        { title: "Albums", releaseGroups: [...albums].sort(byDate) },
        { title: "EPs", releaseGroups: [...eps].sort(byDate) },
        { title: "Live, compilations & more", releaseGroups: [...other].sort(byDate) },
    ].filter((shelf) => shelf.releaseGroups.length > 0)
}

export default function DiscographySection({
    releaseGroups,
    isPending,
    error,
}: DiscographySectionProps) {
    const navigation = useNavigation()
    const [showOther, setShowOther] = useState(false)

    if (isPending) {
        return (
            <ListSection title="Discography">
                <SectionState status="pending" message="Listing releases…" />
            </ListSection>
        )
    }
    if (error) {
        return (
            <ListSection title="Discography">
                <SectionState status="error" error={error} />
            </ListSection>
        )
    }
    const shelves = shelve(releaseGroups ?? [])
    if (shelves.length === 0) {
        return null
    }
    return (
        <>
            {shelves.map((shelf, index) => {
                const isOther = index > 0 && shelf.title.startsWith("Live")
                return (
                    <ListSection
                        key={shelf.title}
                        title={shelf.title}
                        action={
                            isOther && (
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-gray-700 hover:underline"
                                    onClick={() => setShowOther((show) => !show)}
                                >
                                    {showOther ? "Hide" : `Show ${shelf.releaseGroups.length}`}
                                </button>
                            )
                        }
                    >
                        {(!isOther || showOther) &&
                            shelf.releaseGroups.map((group) => (
                                <ItemRow
                                    key={group.id}
                                    leading={
                                        <CoverArt
                                            className="h-10 w-10 shrink-0"
                                            entity={{ kind: "release-group", id: group.id }}
                                            itemTitle={group.title}
                                        />
                                    }
                                    title={group.title}
                                    subtitle={joinDetails(
                                        formatYear(group.firstReleaseDate),
                                        group.secondaryTypes.join(", "),
                                    )}
                                    onClick={() =>
                                        navigation.push({
                                            kind: "album",
                                            releaseGroupId: group.id,
                                            title: group.title,
                                        })
                                    }
                                />
                            ))}
                    </ListSection>
                )
            })}
        </>
    )
}
