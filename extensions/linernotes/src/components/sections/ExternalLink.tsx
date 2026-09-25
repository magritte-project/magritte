import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import type { ReactNode } from "react"

export interface ExternalLinkProps {
    readonly href: string
    readonly children: ReactNode
    readonly className?: string
}

/** A link out of the panel, always in a new window and never handing over the opener */
export default function ExternalLink({ href, children, className }: ExternalLinkProps) {
    return (
        <a
            className={classNames("inline-flex items-center gap-1 hover:underline", className)}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
        >
            {children}
            <ArrowSquareOutIcon className="shrink-0" aria-hidden />
        </a>
    )
}
