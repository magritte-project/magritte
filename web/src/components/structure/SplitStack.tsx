import type { SplitLocation } from "@/splits/base"
import type SplitState from "@/splits/state"

import SplitHeader from "@/components/chrome/SplitHeader"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import useSplits from "@/hooks/splitsHook"
import useSplitRegistry from "@/hooks/splitsRegistryHook"

export interface SplitStackProps {
    readonly splits: SplitState
    readonly location: SplitLocation
}

export default function SplitStack({ splits, location }: SplitStackProps) {
    const registry = useSplitRegistry()
    const { closeSplit } = useSplits()
    return Array.from(
        registry.getAll(splits[location]),
        ([{ id, minWidth, name, component: Component }, index]) => (
            <div
                key={`${id}-${index}`}
                style={{ minWidth, width: minWidth }}
                data-testid={`splits[${location}, ${id}]`}
            >
                <DismissContextProvider value={() => closeSplit({ by: "index", location, index })}>
                    <div className="flex flex-col">
                        <SplitHeader title={name} />
                        <Component />
                    </div>
                </DismissContextProvider>
            </div>
        ),
    )
}
