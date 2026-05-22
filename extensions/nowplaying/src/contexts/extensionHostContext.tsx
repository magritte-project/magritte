import type { ExtensionHost } from "@magritte/sdk/extension"
import { createContext } from "react"

export const ExtensionHostContext = createContext<ExtensionHost | undefined>(undefined)
