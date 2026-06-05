import type { ExtensionHost } from "@magritte/sdk"
import { createContext } from "react"

export const ExtensionHostContext = createContext<ExtensionHost | undefined>(undefined)
