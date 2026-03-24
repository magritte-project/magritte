import { implement, LocalObject, MessageChannelTransport } from "@magritte/rpc"
import {
    createExtensionMessagePorts,
    hostMessageSchema,
    type ExtensionMessage,
} from "@magritte/sdk/extensions"
import { HostChromeProtocol } from "@magritte/sdk/protocols"
import { useEffect, useRef } from "react"

import useToast from "@/hooks/toastHook"

export default function GeniusComTester() {
    const { showToast } = useToast()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const transportRef = useRef<MessageChannelTransport | null>(null)

    useEffect(() => {
        if (!containerRef.current) {
            return
        }
        const container = containerRef.current
        const iframe = document.createElement("iframe")
        iframe.width = "100%"
        iframe.height = "100%"
        iframe.src = "http://localhost:9292"
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== "http://localhost:9292") {
                return
            }
            const { host, extension } = createExtensionMessagePorts()
            transportRef.current = new MessageChannelTransport(
                {
                    name: "root",
                    object: new LocalObject("HostRoot", [
                        implement(HostChromeProtocol, {
                            showToast: async (options: {
                                message: string
                                type: "error" | "success" | "info"
                            }) => {
                                showToast(options)
                            },
                        }),
                    ]),
                    children: [],
                },
                host.sendPort,
                host.receivePort,
            )

            const data = hostMessageSchema.parse(event.data)
            switch (data.type) {
                case "handshake":
                    iframe.contentWindow?.postMessage(
                        {
                            type: "handshake",
                            serialNumber: crypto.randomUUID(),
                        } satisfies ExtensionMessage,
                        "http://localhost:9292",
                        [extension.sendPort, extension.receivePort],
                    )
                    break
            }
        }
        window.addEventListener("message", onMessage)
        container.appendChild(iframe)
        return () => {
            container.removeChild(iframe)
            window.removeEventListener("message", onMessage)
        }
    }, [showToast])

    return <div ref={containerRef} />
}
