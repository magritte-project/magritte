export interface TagsRowProps {
    readonly tags: readonly string[]
    readonly limit?: number
}

export default function TagsRow({ tags, limit = 8 }: TagsRowProps) {
    if (tags.length === 0) {
        return null
    }
    return (
        <ul className="flex flex-wrap gap-1 px-3 pb-2">
            {tags.slice(0, limit).map((tag) => (
                <li key={tag} className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-700">
                    {tag}
                </li>
            ))}
        </ul>
    )
}
