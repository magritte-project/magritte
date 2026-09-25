import { useContext } from "react"

import { ClientsContext, type Clients } from "@/contexts/clientsContext"

export default function useClients(): Clients {
    const clients = useContext(ClientsContext)
    if (clients === undefined) {
        throw new Error("useClients used outside of <ClientsContext.Provider>")
    }
    return clients
}
