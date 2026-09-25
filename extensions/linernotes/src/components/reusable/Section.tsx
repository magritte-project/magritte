import type { ReactNode } from "react"

export interface SectionProps {
    readonly title?: string
    readonly action?: ReactNode
    readonly children?: ReactNode
}

/** A titled block of free-form content, styled like a list section */
export default function Section({ title, action, children }: SectionProps) {
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
            <div className="flex flex-col gap-2 px-3">{children}</div>
        </section>
    )
}
