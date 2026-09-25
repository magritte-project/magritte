import type { ReactNode } from "react"

export interface ItemRowProps {
    readonly leading?: ReactNode
    readonly title?: string | null
    readonly subtitle?: string | null
    readonly accessory?: ReactNode
    readonly onClick?: () => void
}

export default function ItemRow({ leading, title, subtitle, accessory, onClick }: ItemRowProps) {
    return (
        <li className="w-full hover:bg-black/10 flex items-center gap-2 pr-3">
            <button
                type="button"
                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-start"
                onClick={onClick}
            >
                {leading}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="font-bold text-sm truncate">{title ?? "--"}</div>
                    {subtitle && <div className="text-gray-700 text-xs truncate">{subtitle}</div>}
                </div>
            </button>
            {accessory}
        </li>
    )
}
