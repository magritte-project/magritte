import type { ReactNode } from "react"

export interface Fact {
    readonly label: string
    readonly value?: ReactNode
}

export interface FactListProps {
    readonly facts: readonly Fact[]
}

/** Label and value pairs, leaving out anything unknown */
export default function FactList({ facts }: FactListProps) {
    const known = facts.filter(
        (fact) => fact.value !== undefined && fact.value !== null && fact.value !== "",
    )
    if (known.length === 0) {
        return null
    }
    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 pb-2 text-xs">
            {known.map((fact) => (
                <div key={fact.label} className="contents">
                    <dt className="text-gray-500">{fact.label}</dt>
                    <dd className="min-w-0 truncate text-gray-800">{fact.value}</dd>
                </div>
            ))}
        </dl>
    )
}
