import { useState } from "react"

import Section from "@/components/reusable/Section"
import ExternalLink from "@/components/sections/ExternalLink"
import SourceBadge from "@/components/sections/SourceBadge"
import SectionState from "@/components/structure/SectionState"
import type { Prose } from "@/model/types"

export interface ProseSectionProps {
    readonly title?: string
    readonly prose: Prose | null
    readonly isPending: boolean
    /** Show the article's picture alongside the text */
    readonly showThumbnail?: boolean
    /** How much to show before offering the rest */
    readonly maxChars?: number
    /** What to say when there is nothing to read, or nothing to leave out */
    readonly emptyMessage?: string
}

/** Cut text at a word boundary near the limit */
function truncate(text: string, maxChars: number): string {
    const cut = text.lastIndexOf(" ", maxChars)
    return `${text.slice(0, cut > maxChars / 2 ? cut : maxChars).trimEnd()}…`
}

export default function ProseSection({
    title,
    prose,
    isPending,
    showThumbnail = false,
    maxChars = 600,
    emptyMessage,
}: ProseSectionProps) {
    const [expanded, setExpanded] = useState(false)

    if (isPending) {
        return (
            <Section title={title}>
                <SectionState
                    status="pending"
                    message="Finding something to read…"
                    className="px-0"
                />
            </Section>
        )
    }
    if (prose === null) {
        return emptyMessage ? (
            <Section title={title}>
                <SectionState status="empty" message={emptyMessage} className="px-0" />
            </Section>
        ) : null
    }

    const isLong = prose.text.length > maxChars
    const text = isLong && !expanded ? truncate(prose.text, maxChars) : prose.text
    const paragraphs = text.split(/\n{2,}/)
    return (
        <Section title={title}>
            <div className="text-sm leading-relaxed text-gray-800">
                {showThumbnail && prose.thumbnailUrl && (
                    <img
                        className="float-right mb-1 ml-3 w-24 rounded-md border border-black/10"
                        src={prose.thumbnailUrl}
                        alt=""
                        loading="lazy"
                    />
                )}
                {prose.description && (
                    <div className="mb-1 text-xs text-gray-500">{prose.description}</div>
                )}
                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                        {paragraph}
                    </p>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {isLong && (
                    <button
                        type="button"
                        className="font-semibold text-gray-700 hover:underline"
                        onClick={() => setExpanded((expanded) => !expanded)}
                    >
                        {expanded ? "Show less" : "Show more"}
                    </button>
                )}
                <SourceBadge source={prose.source} />
                <ExternalLink href={prose.sourceUrl} className="text-gray-700">
                    Read more
                </ExternalLink>
            </div>
        </Section>
    )
}
