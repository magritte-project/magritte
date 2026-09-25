import { Fragment } from "react"

import useNavigation from "@/hooks/navigationHook"
import type { ArtistCreditPart } from "@/model/types"

export interface ArtistCreditLineProps {
    readonly credit: readonly ArtistCreditPart[]
    readonly fallback?: string | null
}

/** An artist credit where every artist opens their own page */
export default function ArtistCreditLine({ credit, fallback }: ArtistCreditLineProps) {
    const navigation = useNavigation()
    if (credit.length === 0) {
        return fallback ? <span>{fallback}</span> : null
    }
    return (
        <span>
            {credit.map((part, index) => (
                <Fragment key={`${part.artist.id}-${index}`}>
                    <button
                        type="button"
                        className="hover:underline"
                        onClick={() =>
                            navigation.push({
                                kind: "artist",
                                id: part.artist.id,
                                name: part.artist.name,
                            })
                        }
                    >
                        {part.name}
                    </button>
                    {part.joinPhrase}
                </Fragment>
            ))}
        </span>
    )
}
