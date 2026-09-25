import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import useNavigation from "@/hooks/navigationHook"
import type { Membership } from "@/model/types"
import { formatYears, joinDetails } from "@/utilities/format"

export interface MembersSectionProps {
    readonly title: string
    readonly memberships: readonly Membership[]
}

/** The members of a group, or the groups a person has been in */
export default function MembersSection({ title, memberships }: MembersSectionProps) {
    const navigation = useNavigation()
    if (memberships.length === 0) {
        return null
    }
    // Current members first, then by when they joined
    const sorted = [...memberships].sort(
        (a, b) => Number(a.ended) - Number(b.ended) || (a.begin ?? "").localeCompare(b.begin ?? ""),
    )
    return (
        <ListSection title={title}>
            {sorted.map((membership, index) => (
                <ItemRow
                    key={`${membership.artist.id}-${index}`}
                    title={membership.artist.name}
                    subtitle={joinDetails(
                        membership.roles.join(", "),
                        formatYears(membership.begin, membership.end, membership.ended),
                    )}
                    onClick={() =>
                        navigation.push({
                            kind: "artist",
                            id: membership.artist.id,
                            name: membership.artist.name,
                        })
                    }
                />
            ))}
        </ListSection>
    )
}
