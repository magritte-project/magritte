import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/styles.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { LastfmContext, type Lastfm } from "@/contexts/lastfmContext"
import LastfmCommandResponder from "@/extension/responder"
import { LastfmAccount } from "@/lastfm/account"
import { LastfmClient } from "@/lastfm/client"
import { Scrobbler } from "@/lastfm/scrobbler"

function render(children: React.ReactNode) {
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        ReactDOM.createRoot(rootElement).render(<StrictMode>{children}</StrictMode>)
    }
}

try {
    // Set up Last.fm
    const client = new LastfmClient({
        apiKey: import.meta.env.VITE_LASTFM_API_KEY ?? "",
        apiSecret: import.meta.env.VITE_LASTFM_API_SECRET ?? "",
    })
    const account = new LastfmAccount()

    // The command responder has to be handed to the host while connecting, but
    // it only needs the notification center once a command actually runs
    let provideExtensionHost: (extensionHost: ExtensionHost) => void
    const connectedExtensionHost = new Promise<ExtensionHost>((resolve) => {
        provideExtensionHost = resolve
    })

    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.lastfm",
        exports: async () => ({
            commandResponder: new LastfmCommandResponder({
                client,
                account,
                getNotificationCenter: async () =>
                    await (await connectedExtensionHost).notificationCenter(),
            }),
        }),
    })
    provideExtensionHost!(extensionHost)

    // Scrobbling runs whether or not the extension is on screen, which is why
    // the manifest asks to run eagerly and in the background
    const scrobbler = new Scrobbler({
        account,
        client,
        player: await extensionHost.player(),
        broadcaster: extensionHost.connection.broadcaster,
    })
    scrobbler.start()

    // Set up tanstack query
    const queryClient = new QueryClient()

    // Render the app
    const lastfm: Lastfm = { client, account, scrobbler }
    render(
        <ExtensionHostContext.Provider value={extensionHost}>
            <LastfmContext.Provider value={lastfm}>
                <QueryClientProvider client={queryClient}>
                    <Extension />
                </QueryClientProvider>
            </LastfmContext.Provider>
        </ExtensionHostContext.Provider>,
    )
} catch (error) {
    // Render the error state
    console.error("*** Could not start the Last.fm extension", error)
    render(<ContentUnavailable error={error} />)
}
