import Section from "@/components/reusable/Section"
import ExternalLink from "@/components/sections/ExternalLink"
import type { ExternalLinks as Links } from "@/model/types"

export interface ExternalLinksProps {
    readonly links?: Links | null
    /** Known from elsewhere, e.g. the article that was read or a Last.fm lookup */
    readonly wikipediaUrl?: string
    readonly lastfmUrl?: string
}

export default function ExternalLinks({ links, wikipediaUrl, lastfmUrl }: ExternalLinksProps) {
    const entries: readonly { readonly name: string; readonly href?: string }[] = [
        { name: "MusicBrainz", href: links?.musicbrainz },
        { name: "Wikipedia", href: wikipediaUrl },
        { name: "Last.fm", href: links?.lastfm ?? lastfmUrl },
        { name: "Discogs", href: links?.discogs },
        { name: "AllMusic", href: links?.allmusic },
        { name: "Homepage", href: links?.homepage },
    ]
    const known = entries.filter((entry): entry is { name: string; href: string } =>
        Boolean(entry.href),
    )
    if (known.length === 0) {
        return null
    }
    return (
        <Section title="Elsewhere">
            <ul className="flex flex-wrap gap-1">
                {known.map((entry) => (
                    <li key={entry.name}>
                        <ExternalLink
                            href={entry.href}
                            className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-700 hover:bg-black/10 hover:no-underline"
                        >
                            {entry.name}
                        </ExternalLink>
                    </li>
                ))}
            </ul>
        </Section>
    )
}
