import { GearIcon } from "@phosphor-icons/react/dist/ssr"
import { useMemo } from "react"

import SecondaryHeader from "@/components/chrome/SecondaryHeader"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"
import type { PanelDefinition } from "@/utilities/panelRegistry"

export interface PanelsTabLayoutProps {
    readonly definitions: readonly PanelDefinition[]
    readonly selectedPanelId: string | undefined
    readonly selectPanel: (panelId: string | undefined) => void
    readonly preferCompactLayout: boolean
}

export default function PanelsTabLayout({
    selectedPanelId,
    selectPanel,
    definitions,
    preferCompactLayout,
}: PanelsTabLayoutProps) {
    const selectedPanel = useMemo(
        () => definitions.find((panel) => panel.id === selectedPanelId),
        [selectedPanelId, definitions],
    )
    const SelectedComponent = selectedPanel?.component
    return (
        <div
            style={
                preferCompactLayout
                    ? { minHeight: selectedPanel?.preferredHeight ?? "16em" }
                    : { minWidth: selectedPanel?.preferredWidth ?? "16em" }
            }
        >
            <SecondaryHeader>
                <div className="flex items-center gap-0">
                    {definitions.map((panel, index) => (
                        <button
                            key={`panels[${panel.id}@${index}]`}
                            type="button"
                            className="group"
                            onClick={() => selectPanel(panel.id)}
                        >
                            <ThemedTabItemLabel
                                icon={GearIcon}
                                label={panel.name}
                                isActive={selectedPanelId === panel.id}
                            />
                        </button>
                    ))}
                </div>
            </SecondaryHeader>
            <main className="min-h-0 h-screen">{SelectedComponent && <SelectedComponent />}</main>
        </div>
    )
}
