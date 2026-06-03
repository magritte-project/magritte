import { useContext } from "react"

import { AnthropicContext } from "@/contexts/anthropicContext"

export default function useAnthropic() {
    const anthropic = useContext(AnthropicContext)
    if (!anthropic) {
        throw new Error("useAnthropic called outside of <AnthropicProvider>")
    }
    return anthropic
}
