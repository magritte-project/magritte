import Anthropic from "@anthropic-ai/sdk"
import { useMemo } from "react"

import Thread from "@/components/Thread"
import AnthropicProvider from "@/contexts/providers/AnthropicProvider"

export interface SignedInLayoutProps {
    readonly apiKey: string
}

export default function SignedInLayout({ apiKey }: SignedInLayoutProps) {
    const anthropic = useMemo(
        () => new Anthropic({ apiKey, dangerouslyAllowBrowser: true }),
        [apiKey],
    )
    return (
        <AnthropicProvider value={anthropic}>
            <Thread />
        </AnthropicProvider>
    )
}
