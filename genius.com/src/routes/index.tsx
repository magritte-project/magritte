import { cast } from "@magritte/rpc"
import { HostChromeProtocol } from "@magritte/sdk/protocols"
import { createFileRoute } from "@tanstack/react-router"

import useHost from "@/hooks/hostHook"

export const Route = createFileRoute("/")({
    component: function IndexComponent() {
        const host = useHost()
        return (
            <>
                <button
                    type="button"
                    onClick={async () => {
                        const hostRoot = await host.getObject([])
                        const chrome = await cast(HostChromeProtocol, hostRoot)
                        await chrome.showToast({
                            message: "Hello from the extension",
                            type: "info",
                        })
                    }}
                >
                    Show Toast
                </button>
            </>
        )
    },
})
