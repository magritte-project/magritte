import { createFileRoute } from "@tanstack/react-router"
import { useCallback } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"

export const Route = createFileRoute("/tests/chrome")({
    component: function ChromeComponent() {
        const host = useExtensionHost()

        const handleShowToast = useCallback(async () => {
            const chrome = await host.chrome()
            await chrome.showToast({
                message: "Hello from the extension",
                type: "info",
            })
        }, [host])

        return (
            <div className="flex flex-col gap-2">
                <button type="button" onClick={handleShowToast}>
                    Show Toast
                </button>
            </div>
        )
    },
})
