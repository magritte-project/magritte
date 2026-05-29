import { useMediaQuery } from "@uidotdev/usehooks"
import Split from "@uiw/react-split"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import type { Command } from "@/commands/base"
import PanelsTabLayout from "@/components/structure/PanelsTabLayout"
import type { RevealPanelOptions } from "@/contexts/panelsContext"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import PanelsContextProvider from "@/contexts/providers/PanelsProvider"
import usePanelRegistry from "@/hooks/panelRegistryHook"

export interface PanelsProps {
    readonly hidePanels?: boolean
    readonly children?: ReactNode
}

export default function PanelsLayout({ hidePanels = false, children }: PanelsProps) {
    const preferCompactLayout = useMediaQuery("(max-width: 768px)")

    const panelRegistry = usePanelRegistry()
    const [definitions, setDefinitions] = useState(panelRegistry.definitions)
    useEffect(() => {
        const subscription = panelRegistry.$events.subscribe((_event) => {
            setDefinitions(panelRegistry.definitions)
        })
        return () => subscription.unsubscribe()
    }, [panelRegistry])

    const [selectedPanelId, setSelectedPanelId] = useState<string | undefined>(
        () => definitions[0]?.id,
    )
    const revealPanel = useCallback(({ id }: RevealPanelOptions) => {
        setSelectedPanelId(id)
    }, [])

    const panelCommands = useMemo(() => {
        return Array.from(
            definitions,
            (definition): Command => ({
                id: `panels.reveal[${definition.id}]`,
                searchTerms: `show ${definition.name}`,
                present: async () => ({
                    displayName: `Show ${definition.name}`,
                    disabled: false,
                }),
                execute: async () => revealPanel({ id: definition.id }),
            }),
        )
    }, [definitions, revealPanel])

    return hidePanels ? (
        children
    ) : (
        <PanelsContextProvider value={{ revealPanel }}>
            <CommandsProvider commands={panelCommands}>
                <Split
                    mode={preferCompactLayout ? "vertical" : "horizontal"}
                    lineBar={!preferCompactLayout}
                    className="min-h-screen"
                >
                    <div className="flex-1 relative md:h-screen overflow-auto pb-32">
                        {children}
                    </div>
                    <PanelsTabLayout
                        definitions={definitions}
                        selectedPanelId={selectedPanelId}
                        selectPanel={setSelectedPanelId}
                        preferCompactLayout={preferCompactLayout}
                    />
                </Split>
            </CommandsProvider>
        </PanelsContextProvider>
    )
}
