import { useContext } from "react"

import { type SplitsContextType, SplitsContext } from "@/contexts/splitsContext"

export type UseSplitsResult = SplitsContextType

export default function useSplits(): UseSplitsResult {
    const splits = useContext(SplitsContext)
    if (splits === undefined) {
        throw new Error("useSplits() used outside of <SplitsContextProvider>")
    }
    return splits
}
