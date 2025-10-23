import type { APIClient } from "@/api/client"
import { createContext } from "react"

export const APIClientContext = createContext<APIClient | undefined>(undefined)
