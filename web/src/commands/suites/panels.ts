import type { Command } from "@/commands/base"
import type { PanelsContextType } from "@/contexts/panelsContext"
import type { PanelDefinition } from "@/utilities/panelRegistry"

export function panelCommands(
    panels: readonly PanelDefinition[],
    revealPanel: PanelsContextType["revealPanel"],
): Command[] {
    return Array.from(
        panels,
        (panel): Command => ({
            id: `panels.reveal[${panel.id}]`,
            searchTerms: `show open ${panel.name} panel`,
            requiredInputKinds: [],
            present: async () => ({
                displayName: `panels: ${panel.name}`,
            }),
            execute: async () => revealPanel({ id: panel.id }),
        }),
    )
}
