import type { SplitDefinition, SplitLocation, SplitParameter } from "@/splits/base"

import SplitHeader from "@/components/chrome/SplitHeader"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import useSplits from "@/hooks/splitsHook"

export interface SplitPaneProps {
    readonly location: SplitLocation
    readonly definition: SplitDefinition
    readonly parameters: readonly SplitParameter[]
    readonly index: number
}

export default function SplitPane({
    location,
    definition: { id, minWidth, name, component: Component },
    parameters,
    index,
}: SplitPaneProps) {
    const { closeSplit } = useSplits()
    return (
        <div style={{ minWidth, width: minWidth }} data-testid={`splits[${location}, ${id}]`}>
            <DismissContextProvider value={() => closeSplit({ by: "index", location, index })}>
                <div className="flex flex-col relative h-screen overflow-auto pb-32">
                    <SplitHeader title={name} />
                    <Component parameters={parameters} />
                </div>
            </DismissContextProvider>
        </div>
    )
}
