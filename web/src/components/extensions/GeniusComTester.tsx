import { LocalObject, implement, type RPCObject } from "@magritte/rpc"
import { hostHandshake } from "@magritte/sdk/handshake"
import { HostChromeProtocol } from "@magritte/sdk/protocols"
import { useEffect, useRef } from "react"

import useToast from "@/hooks/toastHook"

export default function GeniusComTester() {
    const { showToast } = useToast()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const extensionRef = useRef<RPCObject | null>(null)

    useEffect(() => {
        if (!containerRef.current) {
            return
        }
        const container = containerRef.current
        const iframe = document.createElement("iframe")
        iframe.width = "100%"
        iframe.height = "100%"
        iframe.src = "http://localhost:9292"
        ;(async () => {
            const { extension } = await hostHandshake({
                extensionIFrame: iframe,
                origin: "http://localhost:9292",
                exportedObject: new LocalObject([
                    implement(HostChromeProtocol, {
                        showToast: async (options: {
                            message: string
                            type: "error" | "success" | "info"
                        }) => {
                            showToast(options)
                        },
                    }),
                ]),
            })
            extensionRef.current = extension
        })()
        container.appendChild(iframe)
        return () => {
            container.removeChild(iframe)
        }
    }, [showToast])

    return <div ref={containerRef} />
}
