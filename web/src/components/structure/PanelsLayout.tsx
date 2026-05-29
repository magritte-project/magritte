import { useMediaQuery } from "@uidotdev/usehooks"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

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
                <Group
                    orientation={preferCompactLayout ? "vertical" : "horizontal"}
                    className="min-h-screen"
                >
                    <Panel className="flex-1 relative md:h-screen overflow-auto md:pb-32">
                        {children}
                    </Panel>
                    <Separator className="h-1 md:w-1 md:h-auto rounded-full bg-gray-200" />
                    <Panel collapsible defaultSize="16rem">
                        <PanelsTabLayout
                            definitions={definitions}
                            selectedPanelId={selectedPanelId}
                            selectPanel={setSelectedPanelId}
                        />
                    </Panel>
                </Group>
            </CommandsProvider>
        </PanelsContextProvider>
    )
}
