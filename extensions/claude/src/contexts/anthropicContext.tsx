import type Anthropic from "@anthropic-ai/sdk"
import { createContext } from "react"

export const AnthropicContext = createContext<Anthropic | undefined>(undefined)
