import Split from "@uiw/react-split"
import { useCallback, useMemo, type ReactNode } from "react"
import { type JsonStructure } from "react-cmdk"

import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import { SplitsContext, type OpenSplitOptions } from "@/contexts/splitsContext"
import useSplitRegistry from "@/hooks/splitsRegistryHook"
import useStorageValue from "@/hooks/storageValueHook"
import { NowPlayingSplit } from "@/splits/definitions/NowPlayingSplit"
import SplitState from "@/splits/state"

// TODO: Respond to split definitions being added/removed

export interface SplitsContextProviderProps {
    readonly hideSplit?: boolean
    readonly children?: ReactNode
}

export default function SplitsContextProvider({ hideSplit, children }: SplitsContextProviderProps) {
    const registry = useSplitRegistry()
    const [splits, setSplits] = useStorageValue(
        "splits",
        () => new SplitState([], [NowPlayingSplit.id]),
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
                    options.preferredLocation ?? newSplit.preferredLocation,
                    options.insertOrder ?? "last",
                ),
            )
            return true
        },
        [registry, setSplits],
    )

    const splitItems = useMemo<JsonStructure>(() => {
        return [
            {
                id: "splits",
                heading: "Splits",
                items: Array.from(registry.all(), (split) => ({
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
        <SplitsContext.Provider value={{ openSplit }}>
            <AppCommandsProvider items={splitItems}>
                <Split mode="horizontal" lineBar className="min-h-screen">
                    {Array.from(
                        registry.getAll(splits.start),
                        ([{ id, minWidth, component: Component }, index]) => (
                            <div
                                key={`${id}-${index}`}
                                style={{ minWidth, width: minWidth }}
                                data-testid={`splits[${id}]`}
                            >
                                <DismissContextProvider
                                    value={() =>
                                        setSplits((oldSplits) => oldSplits.removeAt(index, "start"))
                                    }
                                >
                                    <Component />
                                </DismissContextProvider>
                            </div>
                        ),
                    )}
                    <div className="flex-1">{children}</div>
                    {Array.from(
                        registry.getAll(splits.end),
                        ([{ id, minWidth, component: Component }, index]) => (
                            <div
                                key={`${id}-${index}`}
                                style={{ minWidth, width: minWidth }}
                                data-testid={`splits[${id}]`}
                            >
                                <DismissContextProvider
                                    value={() =>
                                        setSplits((oldSplits) => oldSplits.removeAt(index, "end"))
                                    }
                                >
                                    <Component />
                                </DismissContextProvider>
                            </div>
                        ),
                    )}
                </Split>
            </AppCommandsProvider>
        </SplitsContext.Provider>
    )
}
