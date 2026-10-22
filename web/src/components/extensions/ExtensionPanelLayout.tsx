import type { ExtensionManifest } from "@magritte/api"
import { useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

import type { Command } from "@/commands/base"
import ExtensionComponent from "@/components/extensions/ExtensionComponent"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import ThemedHeader from "@/components/theme/ThemedHeader"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import useStorageValue from "@/hooks/storageValueHook"

export interface ExtensionPanelLayoutProps {
    readonly children?: ReactNode
}

export default function ExtensionPanelLayout({ children }: ExtensionPanelLayoutProps) {
    const preferVerticalOrientation = useMediaQuery("(max-width: 768px)")

    const extensionRuntime = useExtensionRuntime()
    const [available, setAvailable] = useState<readonly ExtensionManifest[]>(() => [
        ...extensionRuntime.available,
    ])
    // Extensions open and close one at a time, so closing one leaves the others in the panel
    const [openIds, setOpenIds] = useStorageValue<readonly string[]>("panels.openIds", [])
    const [selectedId, setSelectedId] = useStorageValue<string | null>("panels.selectedId", null)

    const openExtension = useCallback(
        (id: string) => {
            setOpenIds((openIds) => (openIds.includes(id) ? openIds : [...openIds, id]))
            setSelectedId(id)
        },
        [setOpenIds, setSelectedId],
    )
    const closeExtension = useCallback(
        (id: string) => {
            setOpenIds((openIds) => openIds.filter((openId) => openId !== id))
            // Clearing the selection hands the panel to whichever extension is still open
            setSelectedId((selectedId) => (selectedId === id ? null : selectedId))
        },
        [setOpenIds, setSelectedId],
    )

    useEffect(() => {
        return extensionRuntime.subscribe((event) => {
            switch (event.type) {
                case "extensionAdded": {
                    setAvailable([...extensionRuntime.available])
                    break
                }
                case "extensionRemoved": {
                    setAvailable([...extensionRuntime.available])
                    closeExtension(event.manifest.id)
                    break
                }
                case "extensionOpenRequested": {
                    openExtension(event.manifest.id)
                    break
                }
                case "extensionCloseRequested": {
                    closeExtension(event.manifest.id)
                    break
                }
                default: {
                    break
                }
            }
        })
    }, [extensionRuntime, openExtension, closeExtension])

    const openExtensions = useMemo(
        () => openIds.flatMap((id) => available.find((extension) => extension.id === id) ?? []),
        [available, openIds],
    )
    const selectedExtension = useMemo(
        () =>
            openExtensions.find((extension) => extension.id === selectedId) ??
            openExtensions[0] ??
            null,
        [openExtensions, selectedId],
    )
    const commands = useMemo(() => {
        return [
            ...available.map((extension): Command => ({
                id: `extensions.reveal[${extension.id}]`,
                searchTerms: `show open ${extension.name} extension`,
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: `extensions: ${extension.name}`,
                }),
                execute: async () => openExtension(extension.id),
            })),
            ...openExtensions.map((extension): Command => ({
                id: `extensions.close[${extension.id}]`,
                searchTerms: `close hide ${extension.name} extension`,
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: `extensions: close ${extension.name}`,
                    disabled: !openExtensions.some((candidate) => candidate.id === extension.id),
                }),
                execute: async () => closeExtension(extension.id),
            })),
        ]
    }, [available, openExtensions, openExtension, closeExtension])

    return (
        <CommandsProvider commands={commands}>
            <Group
                orientation={preferVerticalOrientation ? "vertical" : "horizontal"}
                className="h-screen!"
            >
                <Panel
                    className={classNames("router-scroll-to-top relative overflow-auto pb-footer", {
                        "h-screen": !preferVerticalOrientation,
                    })}
                    minSize="16rem"
                >
                    {children}
                </Panel>
                {selectedExtension && (
                    <>
                        {/* Horizontally the separator is only a drag target; vertically it doubles as a grabber */}
                        <Separator
                            className={classNames({
                                "rounded-t-full bg-linear-to-b from-separator to-transparent h-2":
                                    preferVerticalOrientation,
                                "w-1": !preferVerticalOrientation,
                            })}
                        />
                        <Panel
                            collapsible
                            minSize="12rem"
                            className={classNames("relative flex flex-col overflow-auto", {
                                "h-screen": !preferVerticalOrientation,
                            })}
                            defaultSize={
                                (preferVerticalOrientation
                                    ? selectedExtension.preferredHeight
                                    : selectedExtension.preferredWidth) ?? "16rem"
                            }
                        >
                            <ThemedHeader>
                                <div className="flex items-center gap-md overflow-x-auto">
                                    {openExtensions.map((extension, index) => (
                                        <button
                                            key={`panels[${extension.id}@${index}]`}
                                            type="button"
                                            className="group"
                                            onClick={() => setSelectedId(extension.id)}
                                            title={extension.name}
                                            data-active={
                                                selectedExtension.id === extension.id
                                                    ? ""
                                                    : undefined
                                            }
                                        >
                                            <ExtensionIcon
                                                iconUrl={extension.icon_url}
                                                name={extension.name}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </ThemedHeader>
                            <main className="flex-1 px-lg pb-lg">
                                <ExtensionComponent manifest={selectedExtension} />
                            </main>
                        </Panel>
                    </>
                )}
            </Group>
        </CommandsProvider>
    )
}
