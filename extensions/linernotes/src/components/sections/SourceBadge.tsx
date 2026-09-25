import type { ProseSource } from "@/model/types"

export function getSourceName(source: ProseSource): string {
    switch (source) {
        case "wikipedia":
            return "Wikipedia"
        case "lastfm":
            return "Last.fm"
    }
}

export default function SourceBadge({ source }: { readonly source: ProseSource }) {
    return <span className="text-xs text-gray-500">From {getSourceName(source)}</span>
}
