import type { ExtensionHost } from "@magritte/sdk/connection"
import { createContext } from "react"

export const ExtensionHostContext = createContext<ExtensionHost | undefined>(undefined)
