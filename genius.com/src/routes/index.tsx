import { createFileRoute } from "@tanstack/react-router"

import useExtensionHost from "@/hooks/extensionHostHook"

export const Route = createFileRoute("/")({
    component: function IndexComponent() {
        const host = useExtensionHost()
        return (
            <>
                <button
                    type="button"
                    onClick={async () => {
                        const chrome = await host.chrome()
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
