import { createContext } from "react"

import type { Agent } from "@/agent/agent"

export const AgentContext = createContext<Agent | null>(null)
