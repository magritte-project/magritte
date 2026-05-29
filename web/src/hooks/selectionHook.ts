import { useCallback, useState } from "react"

export interface UseSelectionOptions {
    readonly initialSelection?: Iterable<number>
}

export interface UseSelectionResult {
    readonly selection: ReadonlySet<number>
    readonly setSelection: React.Dispatch<React.SetStateAction<ReadonlySet<number>>>
    readonly isSelected: (id: number) => boolean
    readonly select: (id: number) => void
    readonly deselect: (id: number) => void
    readonly toggle: (id: number) => void
}

export default function useSelection({
    initialSelection,
}: UseSelectionOptions = {}): UseSelectionResult {
    const [selection, setSelection] = useState<ReadonlySet<number>>(
        () => new Set(initialSelection ?? []),
    )
    const isSelected = useCallback(
        (id: number) => {
            return selection.has(id)
        },
        [selection],
    )
    const select = useCallback((id: number) => {
        setSelection((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
    }, [])
    const deselect = useCallback((id: number) => {
        setSelection((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }, [])
    const toggle = useCallback((id: number) => {
        setSelection((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])
    return { selection, setSelection, isSelected, select, deselect, toggle }
}
