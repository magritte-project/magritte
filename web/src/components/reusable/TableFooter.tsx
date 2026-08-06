import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import type React from "react"
import { type ReactNode, useCallback, useMemo } from "react"

export interface TableFooterProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "children"
> {
    readonly singularLabel: ReactNode
    readonly pluralLabel: ReactNode
    readonly offset: number
    readonly limit: number
    readonly total: number
    readonly onChange?: (offset: number, limit: number) => void
}

export default function TableFooter({
    className,
    singularLabel,
    pluralLabel,
    offset,
    limit,
    total,
    onChange,
    ...rest
}: TableFooterProps) {
    const canGoBack = useMemo(() => {
        return offset > 0
    }, [offset])
    const handleGoBack = useCallback(() => {
        onChange?.(offset - limit, limit)
    }, [onChange, offset, limit])

    const canGoForward = useMemo(() => {
        return offset > total - limit
    }, [offset, total, limit])
    const handleGoForward = useCallback(() => {
        onChange?.(offset + limit, limit)
    }, [onChange, offset, limit])

    return (
        <footer className={classNames("flex items-center gap-1", className)} {...rest}>
            {total > limit && (
                <button
                    type="button"
                    className="text-key active:text-key-active disabled:opacity-disabled font-bold"
                    disabled={!canGoBack}
                    onClick={handleGoBack}
                >
                    <CaretLeftIcon weight="bold" aria-label="Previous Page" />
                </button>
            )}
            <span className="text-sm text-on-secondary">
                {new Intl.NumberFormat().format(total)} {total === 1 ? singularLabel : pluralLabel}
            </span>
            {total > limit && (
                <button
                    type="button"
                    className="text-key active:text-key-active disabled:opacity-disabled font-bold"
                    disabled={canGoForward}
                    onClick={handleGoForward}
                >
                    <CaretRightIcon weight="bold" aria-label="Next Page" />
                </button>
            )}
        </footer>
    )
}
