import { createContext } from "react"

import type { APIClient } from "@/api/client"

export const APIClientContext = createContext<APIClient | undefined>(undefined)
