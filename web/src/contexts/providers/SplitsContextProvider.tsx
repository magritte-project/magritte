import Split from "@uiw/react-split"
import { useCallback, useMemo, useState, type ReactNode } from "react"
import { type JsonStructure } from "react-cmdk"

import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import { SplitsContext, type OpenSplitOptions } from "@/contexts/splitsContext"
import useSplitRegistry from "@/hooks/splitsRegistryHook"
import { NowPlayingSplit } from "@/splits/definitions/NowPlayingSplit"
import SplitState from "@/splits/state"

// TODO: Respond to split definitions being added/removed

export interface SplitsContextProviderProps {
    readonly hideSplit?: boolean
    readonly children?: ReactNode
}

export default function SplitsContextProvider({ hideSplit, children }: SplitsContextProviderProps) {
    const registry = useSplitRegistry()
    const [splits, setSplits] = useState(() => new SplitState([], [NowPlayingSplit]))

    const openSplit = useCallback(
        (options: OpenSplitOptions) => {
            const newSplit = registry.get(options.id)
            if (!newSplit) {
                console.error(`*** Could not find split with id ${options.id}`)
                return false
            }
            setSplits((oldSplits) =>
                oldSplits.add(
                    newSplit,
                    options.preferredLocation ?? newSplit.preferredLocation,
                    options.insertOrder ?? "last",
                ),
            )
            return true
        },
        [registry],
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
                    disabled: !split.allowsMultiple && splits.allOpenIds.has(split.id),
                })),
            },
        ]
    }, [registry, openSplit, splits.allOpenIds])

    return hideSplit ? (
        children
    ) : (
        <SplitsContext.Provider value={{ openSplit }}>
            <AppCommandsProvider items={splitItems}>
                <Split mode="horizontal" lineBar className="min-h-screen">
                    {splits.start.map(({ id, minWidth, component: Component }, index) => (
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
                    ))}
                    <div className="flex-1">{children}</div>
                    {splits.end.map(({ id, minWidth, component: Component }, index) => (
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
                    ))}
                </Split>
            </AppCommandsProvider>
        </SplitsContext.Provider>
    )
}
