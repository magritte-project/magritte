import type Anthropic from "@anthropic-ai/sdk"
import type { ReactNode } from "react"

import { AnthropicContext } from "@/contexts/anthropicContext"

export interface AnthropicProviderProps {
    readonly value: Anthropic
    readonly children: ReactNode
}

export default function AnthropicProvider({ value, children }: AnthropicProviderProps) {
    return <AnthropicContext.Provider value={value}>{children}</AnthropicContext.Provider>
}
