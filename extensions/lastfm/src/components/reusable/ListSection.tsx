import type { ReactNode } from "react"

export interface ListSectionProps {
    readonly title?: string
    readonly action?: ReactNode
    readonly children?: ReactNode
}

export default function ListSection({ title, action, children }: ListSectionProps) {
    return (
        <section className="flex flex-col pb-2">
            {(title || action) && (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <h2 className="flex-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {title}
                    </h2>
                    {action}
                </div>
            )}
            <ol className="flex flex-col">{children}</ol>
        </section>
    )
}
