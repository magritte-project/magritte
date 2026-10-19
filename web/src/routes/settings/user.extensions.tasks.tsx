import { getErrorMessage } from "@magritte/rpc"
import { SkullIcon } from "@phosphor-icons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import ModalHeader from "@/components/chrome/ModalHeader"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import Modal from "@/components/reusable/Modal"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/settings/user/extensions/tasks")({
    component: function UserExtensionsManage() {
        const extensionRuntime = useExtensionRuntime()
        const [loading, setLoading] = useState(() => Array.from(extensionRuntime.loading))
        const [running, setRunning] = useState(() => Array.from(extensionRuntime.running))
        useEffect(() => {
            return extensionRuntime.subscribe((event) => {
                switch (event.type) {
                    case "extensionLoadStart":
                    case "extensionLoadFailed":
                        setLoading(Array.from(extensionRuntime.loading))
                        break
                    case "extensionLoaded":
                    case "extensionUnloaded":
                        setLoading(Array.from(extensionRuntime.loading))
                        setRunning(Array.from(extensionRuntime.running))
                        break
                    default:
                        break
                }
            })
        }, [extensionRuntime])

        const notificationCenter = useNotificationCenter()
        const terminate = useCallback(
            (id: string) => {
                try {
                    extensionRuntime.terminate(id)
                } catch (error) {
                    void notificationCenter.showDialog({
                        type: "error",
                        title: "Could not terminate extension",
                        message: getErrorMessage(error),
                    })
                }
            },
            [extensionRuntime, notificationCenter],
        )

        return (
            <Modal className="w-120">
                <ModalHeader>Task Manager</ModalHeader>
                <div className="flex flex-col gap-lg">
                    {loading.length === 0 && running.length === 0 && (
                        <p className="px-xl py-8 text-center text-sm text-on-secondary">
                            No extensions running or loading
                        </p>
                    )}
                    <ol>
                        {loading.map((extensionManifest) => (
                            <li
                                key={`extensions.loading[${extensionManifest.id}]`}
                                className="bg-secondary odd:bg-inherit"
                            >
                                <button
                                    type="button"
                                    className="p-lg w-full text-left flex items-center gap-lg"
                                    title="Terminate"
                                    onClick={() => terminate(extensionManifest.id)}
                                >
                                    <ExtensionIcon
                                        iconUrl={extensionManifest.icon_url}
                                        name={extensionManifest.name}
                                        size="3rem"
                                    />
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-medium">
                                            {extensionManifest.name}
                                        </span>
                                        <span className="text-sm text-on-secondary">Loading</span>
                                    </div>
                                    <SkullIcon />
                                </button>
                            </li>
                        ))}
                        {running.map((extension) => (
                            <li
                                key={`extensions.running[${extension.manifest.id}]`}
                                className="bg-secondary odd:bg-inherit"
                            >
                                <button
                                    type="button"
                                    className="p-lg w-full text-left flex items-center gap-lg"
                                    title="Terminate"
                                    onClick={() => terminate(extension.manifest.id)}
                                >
                                    <ExtensionIcon
                                        iconUrl={extension.manifest.icon_url}
                                        name={extension.manifest.name}
                                        size="3rem"
                                    />
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-medium">
                                            {extension.manifest.name}
                                        </span>
                                        <span className="text-sm text-on-secondary">Running</span>
                                    </div>
                                    <SkullIcon />
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
            </Modal>
        )
    },
})
