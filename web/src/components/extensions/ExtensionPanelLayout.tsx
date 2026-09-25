import type { ExtensionManifest } from "@magritte/api"
import { XIcon } from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import { useMediaQuery } from "@uidotdev/usehooks"
import classNames from "classnames"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

import type { Command } from "@/commands/base"
import ExtensionComponent from "@/components/extensions/ExtensionComponent"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import DismissContextProvider from "@/contexts/providers/DismissContextProvider"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import useStorageValue from "@/hooks/storageValueHook"

export interface ExtensionPanelLayoutProps {
    readonly children?: ReactNode
}

export default function ExtensionPanelLayout({ children }: ExtensionPanelLayoutProps) {
    const navigate = useNavigate()
    const preferVerticalOrientation = useMediaQuery("(max-width: 768px)")

    const extensionRuntime = useExtensionRuntime()
    const [available, setAvailable] = useState<readonly ExtensionManifest[]>(() => [
        ...extensionRuntime.available,
    ])
    const [selectedId, setSelectedId] = useStorageValue<string | null>("panels.selectedId", null)
    useEffect(() => {
        extensionRuntime.subscribe((event) => {
            switch (event.type) {
                case "extensionAdded":
                case "extensionRemoved": {
                    const available = [...extensionRuntime.available]
                    setAvailable(available)
                    setSelectedId((oldId) => {
                        if (available.some((extension) => extension.id === oldId)) {
                            return oldId
                        } else if (available.length > 0) {
                            return available[0].id
                        } else {
                            return null
                        }
                    })
                    break
                }
                default: {
                    break
                }
            }
        })
    }, [extensionRuntime, setSelectedId])

    const selectedExtension = useMemo(
        () => available.find((extension) => extension.id === selectedId),
        [available, selectedId],
    )
    const handleDismiss = useCallback(() => setSelectedId(null), [setSelectedId])
    const commands = useMemo(() => {
        return [
            ...available.map(
                (extension): Command => ({
                    id: `extensions.reveal[${extension.id}]`,
                    searchTerms: `show open ${extension.name} extension`,
                    requiredInputKinds: [],
                    highlightAvailability: false,
                    present: async () => ({
                        displayName: `extensions: ${extension.name}`,
                    }),
                    execute: async () => setSelectedId(extension.id),
                }),
            ),
            {
                id: "extensions.close",
                searchTerms: "close extension",
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: `extensions: close`,
                }),
                execute: async () => setSelectedId(null),
            } satisfies Command,
            {
                id: "extensions.manage",
                searchTerms: "install uninstall extensions",
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: `extensions: install/uninstall`,
                }),
                execute: async () => navigate({ to: "/settings/user/extensions" }),
            } satisfies Command,
            {
                id: "extensions.taskManager",
                searchTerms: "extensions task manager",
                requiredInputKinds: [],
                highlightAvailability: false,
                present: async () => ({
                    displayName: `extensions: task manager`,
                }),
                execute: async () => navigate({ to: "/settings/user/extensions/tasks" }),
            } satisfies Command,
        ]
    }, [available, setSelectedId, navigate])

    return (
        <CommandsProvider commands={commands}>
            <Group
                orientation={preferVerticalOrientation ? "vertical" : "horizontal"}
                className="h-screen!"
            >
                <Panel
                    className={classNames("router-scroll-to-top relative overflow-auto pb-32", {
                        "h-screen": !preferVerticalOrientation,
                    })}
                    minSize="16rem"
                >
                    {children}
                </Panel>
                {selectedExtension && (
                    <>
                        <Separator
                            className={classNames({
                                "rounded-t-full bg-linear-to-b from-separator to-transparent h-2":
                                    preferVerticalOrientation,
                                "rounded-full bg-separator w-1": !preferVerticalOrientation,
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
                            <DismissContextProvider value={handleDismiss}>
                                <ThemedHeader
                                    supplementaryStart={
                                        <ThemedSubtleButton
                                            type="button"
                                            onClick={handleDismiss}
                                            title="Close"
                                        >
                                            <XIcon />
                                        </ThemedSubtleButton>
                                    }
                                >
                                    <div className="flex items-center gap-2 overflow-x-auto">
                                        {available.map((extension, index) => (
                                            <button
                                                key={`panels[${extension.id}@${index}]`}
                                                type="button"
                                                className="group"
                                                onClick={() => setSelectedId(extension.id)}
                                                title={extension.name}
                                                data-active={
                                                    selectedId === extension.id ? "" : undefined
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
                                <main className="flex-1 px-outside pb-outside">
                                    <ExtensionComponent manifest={selectedExtension} />
                                </main>
                            </DismissContextProvider>
                        </Panel>
                    </>
                )}
            </Group>
        </CommandsProvider>
    )
}
