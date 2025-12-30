import { createContext } from "react"

export type Dismiss = () => void
export const DismissContext = createContext<Dismiss | undefined>(undefined)
