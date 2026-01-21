import Split from "@uiw/react-split"
import { useCallback, useMemo, type ReactNode } from "react"
import { type JsonStructure } from "react-cmdk"

import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import SplitsContextProvider from "@/contexts/providers/SplitsContextProvider"
import { type CloseSplitOptions, type OpenSplitOptions } from "@/contexts/splitsContext"
import useSplitRegistry from "@/hooks/splitsRegistryHook"
import useStorageValue from "@/hooks/storageValueHook"
import { NowPlayingSplit } from "@/splits/definitions/NowPlayingSplit"
import SplitState from "@/splits/state"

import SplitStack from "./SplitStack"

// TODO: Respond to split definitions being added/removed

export interface SplitsProps {
    readonly hideSplit?: boolean
    readonly children?: ReactNode
}

export default function Splits({ hideSplit, children }: SplitsProps) {
    const registry = useSplitRegistry()
    const [splits, setSplits] = useStorageValue(
        "splits",
        () => new SplitState([], [{ id: NowPlayingSplit.id, parameters: [] }]),
        { parse: (json) => SplitState.parse(json), stringify: (state) => state.stringify() },
    )

    const openSplit = useCallback(
        (options: OpenSplitOptions) => {
            const newSplit = registry.get(options.id)
            if (!newSplit) {
                console.error(`*** Could not find split with id ${options.id}`)
                return false
            }
            setSplits((oldSplits) =>
                oldSplits.add(
                    newSplit.id,
                    newSplit.allowsMultiple,
                    options.parameters ?? [],
                    options.preferredLocation ?? newSplit.preferredLocation,
                    options.insertOrder ?? "last",
                ),
            )
            return true
        },
        [registry, setSplits],
    )
    const closeSplit = useCallback(
        (options: CloseSplitOptions) => {
            setSplits((oldSplits) => {
                switch (options.by) {
                    case "index":
                        return oldSplits.removeAt(options.index, options.location)
                }
            })
        },
        [setSplits],
    )

    const splitItems = useMemo<JsonStructure>(() => {
        return [
            {
                id: "splits",
                heading: "Splits",
                items: Array.from(registry.allOpenable(), (split) => ({
                    id: `splits.open[${split.id}]`,
                    icon: split.icon,
                    children: `Open ${split.name}`,
                    onClick: () => openSplit(split),
                    disabled: !split.allowsMultiple && splits.has(split.id),
                })),
            },
        ]
    }, [registry, openSplit, splits])

    return hideSplit ? (
        children
    ) : (
        <SplitsContextProvider value={{ openSplit, closeSplit }}>
            <AppCommandsProvider items={splitItems}>
                <Split mode="horizontal" lineBar className="min-h-screen">
                    <SplitStack splits={splits} location="start" />
                    <div className="flex-1">{children}</div>
                    <SplitStack splits={splits} location="end" />
                </Split>
            </AppCommandsProvider>
        </SplitsContextProvider>
    )
}
