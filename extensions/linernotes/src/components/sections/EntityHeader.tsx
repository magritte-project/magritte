import type { ReactNode } from "react"

export interface EntityHeaderProps {
    readonly artwork?: ReactNode
    readonly title: string
    readonly subtitle?: ReactNode
    readonly details?: ReactNode
}

/** The top of an artist, album or song page */
export default function EntityHeader({ artwork, title, subtitle, details }: EntityHeaderProps) {
    return (
        <div className="flex items-center gap-3 px-3 py-3">
            {artwork}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="text-base font-bold leading-tight">{title}</div>
                {subtitle && <div className="truncate text-sm text-gray-700">{subtitle}</div>}
                {details && <div className="mt-0.5 truncate text-xs text-gray-500">{details}</div>}
            </div>
        </div>
    )
}
