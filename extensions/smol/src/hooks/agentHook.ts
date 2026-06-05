import { useContext } from "react"

import { AgentContext } from "@/contexts/agentContext"

export function useAgent() {
    const agent = useContext(AgentContext)
    if (agent === null) {
        throw new Error("useAgent() used outside of <AgentContextProvider>")
    }
    return agent
}
