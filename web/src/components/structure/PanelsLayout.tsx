import { XIcon } from "@phosphor-icons/react"
import { useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { useCallback, useMemo, type ReactNode } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import type { RevealPanelOptions } from "@/contexts/panelsContext"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import PanelsContextProvider from "@/contexts/providers/PanelsProvider"
import usePanelRegistry from "@/hooks/panelRegistryHook"
import useStorageValue from "@/hooks/storageValueHook"

export interface PanelsProps {
    readonly children?: ReactNode
}

export default function PanelsLayout({ children }: PanelsProps) {
    const preferVerticalOrientation = useMediaQuery("(max-width: 768px)")

    const { panels } = usePanelRegistry()
    const [selectedId, setSelectedId] = useStorageValue<string | null>("panels.selectedId", null)
    const [SelectedComponent, preferredWidth = "16rem", preferredHeight = "16rem"] = useMemo(() => {
        const selectedPanel = panels.find((panel) => panel.id === selectedId)
        return [
            selectedPanel?.component,
            selectedPanel?.preferredWidth,
            selectedPanel?.preferredHeight,
        ] as const
    }, [selectedId, panels])

    const revealPanel = useCallback(
        ({ id }: RevealPanelOptions) => {
            setSelectedId(id)
        },
        [setSelectedId],
    )
    const hidePanels = useCallback(() => {
        setSelectedId(null)
    }, [setSelectedId])

    return (
        <PanelsContextProvider value={{ panels, revealPanel, hidePanels }}>
            <Group
                orientation={preferVerticalOrientation ? "vertical" : "horizontal"}
                className="h-screen!"
            >
                <Panel
                    className={classNames("relative overflow-auto pb-32", {
                        "h-screen": !preferVerticalOrientation,
                    })}
                    minSize="16rem"
                >
                    {children}
                </Panel>
                {SelectedComponent && (
                    <>
                        <Separator
                            className={classNames({
                                "rounded-t-full bg-linear-to-b from-gray-200 to-transparent h-2":
                                    preferVerticalOrientation,
                                "rounded-full bg-gray-200 w-1": !preferVerticalOrientation,
                            })}
                        />
                        <Panel
                            collapsible
                            className={classNames("relative flex flex-col overflow-auto", {
                                "h-screen": !preferVerticalOrientation,
                            })}
                            defaultSize={
                                preferVerticalOrientation ? preferredHeight : preferredWidth
                            }
                        >
                            <DismissContextProvider value={hidePanels}>
                                <ThemedHeader
                                    supplementaryStart={
                                        <ThemedSubtleButton
                                            type="button"
                                            onClick={hidePanels}
                                            title="Close"
                                        >
                                            <XIcon />
                                        </ThemedSubtleButton>
                                    }
                                >
                                    <div className="flex items-center gap-2 overflow-x-auto">
                                        {panels.map((panel, index) => (
                                            <button
                                                key={`panels[${panel.id}@${index}]`}
                                                type="button"
                                                className="group"
                                                onClick={() => setSelectedId(panel.id)}
                                                title={panel.name}
                                                data-active={
                                                    selectedId === panel.id ? "" : undefined
                                                }
                                            >
                                                {panel.icon}
                                            </button>
                                        ))}
                                    </div>
                                </ThemedHeader>
                                <main className="flex-1">
                                    <SelectedComponent />
                                </main>
                            </DismissContextProvider>
                        </Panel>
                    </>
                )}
            </Group>
        </PanelsContextProvider>
    )
}
