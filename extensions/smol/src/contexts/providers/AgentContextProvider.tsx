import type { Agent } from "@/agent/agent"
import { AgentContext } from "@/contexts/agentContext"

export interface AgentContextProviderProps {
    readonly agent: Agent
    readonly children: React.ReactNode
}

export default function AgentContextProvider({ agent, children }: AgentContextProviderProps) {
    return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>
}
