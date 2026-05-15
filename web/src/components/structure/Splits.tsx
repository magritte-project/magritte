import Split from "@uiw/react-split"
import { useCallback, useMemo, type ReactNode } from "react"

import type { Command } from "@/commands/base"
import SplitPane from "@/components/structure/SplitPane"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
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

    const splitCommands = useMemo(() => {
        return Array.from(
            registry.allOpenable(),
            (split): Command => ({
                id: `splits.open[${split.id}]`,
                searchTerms: `open ${split.name}`,
                present: async () => ({
                    displayName: `Open ${split.name}`,
                    disabled: !split.allowsMultiple && splits.has(split.id),
                }),
                execute: async () => openSplit(split),
            }),
        )
    }, [registry, openSplit, splits])

    return hideSplit ? (
        children
    ) : (
        <SplitsContextProvider value={{ openSplit, closeSplit }}>
            <CommandsProvider commands={splitCommands}>
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
            </CommandsProvider>
        </SplitsContextProvider>
    )
}
