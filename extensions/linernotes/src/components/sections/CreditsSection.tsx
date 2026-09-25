import ItemRow from "@/components/reusable/ItemRow"
import ListSection from "@/components/reusable/ListSection"
import SectionState from "@/components/structure/SectionState"
import useNavigation from "@/hooks/navigationHook"
import type { Credit } from "@/model/types"
import { groupCredits } from "@/musicbrainz/credits"

export interface CreditsSectionProps {
    readonly credits: readonly Credit[] | undefined
    readonly isPending: boolean
    readonly error?: unknown
}

/** Who did what, grouped by kind of contribution, each name opening the artist */
export default function CreditsSection({ credits, isPending, error }: CreditsSectionProps) {
    const navigation = useNavigation()
    if (isPending) {
        return (
            <ListSection title="Credits">
                <SectionState status="pending" message="Reading the credits…" />
            </ListSection>
        )
    }
    if (error) {
        return (
            <ListSection title="Credits">
                <SectionState status="error" error={error} />
            </ListSection>
        )
    }
    const groups = groupCredits(credits ?? [])
    if (groups.length === 0) {
        return (
            <ListSection title="Credits">
                <SectionState status="empty" message="MusicBrainz has no credits for this yet." />
            </ListSection>
        )
    }
    return (
        <>
            {groups.map((group) => (
                <ListSection key={group.title} title={group.title}>
                    {group.credits.map((credit) => (
                        <ItemRow
                            key={credit.artist.id}
                            title={credit.artist.name}
                            subtitle={credit.roles.join(" · ")}
                            onClick={() =>
                                navigation.push({
                                    kind: "artist",
                                    id: credit.artist.id,
                                    name: credit.artist.name,
                                })
                            }
                        />
                    ))}
                </ListSection>
            ))}
        </>
    )
}
