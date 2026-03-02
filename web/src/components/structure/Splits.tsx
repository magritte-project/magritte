import Split from "@uiw/react-split"
import { useCallback, useMemo, type ReactNode } from "react"
import { type JsonStructure } from "react-cmdk"

import SplitPane from "@/components/structure/SplitPane"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import SplitsContextProvider from "@/contexts/providers/SplitsContextProvider"
import { type CloseSplitOptions, type OpenSplitOptions } from "@/contexts/splitsContext"
import useSplitRegistry from "@/hooks/splitsRegistryHook"
import useStorageValue from "@/hooks/storageValueHook"
import SplitState from "@/splits/state"

// TODO: Respond to split definitions being added/removed

export interface SplitsProps {
    readonly hideSplit?: boolean
    readonly children?: ReactNode
}

export default function Splits({ hideSplit, children }: SplitsProps) {
    const registry = useSplitRegistry()
    const [splits, setSplits] = useStorageValue("splits", () => new SplitState([], []), {
        parse: (json) => SplitState.parse(json),
        stringify: (state) => state.stringify(),
    })

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
                    {Array.from(
                        registry.getAll(splits["start"]),
                        ([definition, parameters, index]) => (
                            <SplitPane
                                key={`${definition.id}-${index}`}
                                location="start"
                                definition={definition}
                                parameters={parameters}
                                index={index}
                            />
                        ),
                    )}
                    <div className="flex-1 relative h-screen overflow-auto pb-32">{children}</div>
                    {Array.from(
                        registry.getAll(splits["end"]),
                        ([definition, parameters, index]) => (
                            <SplitPane
                                key={`${definition.id}-${index}`}
                                location="end"
                                definition={definition}
                                parameters={parameters}
                                index={index}
                            />
                        ),
                    )}
                </Split>
            </AppCommandsProvider>
        </SplitsContextProvider>
    )
}
