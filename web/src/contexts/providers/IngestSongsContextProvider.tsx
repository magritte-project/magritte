import type { ReactNode } from "react"
import {
    IngestSongsContext,
    type IngestSongsContextType,
} from "@/contexts/ingestSongsContext"

export interface IngestSongsContextProviderProps {
    readonly value: IngestSongsContextType
    readonly children?: ReactNode
}

export default function IngestSongsContextProvider({
    value,
    children,
}: IngestSongsContextProviderProps) {
    return (
        <IngestSongsContext.Provider value={value}>
            {children}
        </IngestSongsContext.Provider>
    )
}
