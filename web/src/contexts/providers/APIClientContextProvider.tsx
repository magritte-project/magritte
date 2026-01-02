import type { ReactNode } from "react"

import type { APIClient } from "@/api/client"

import { APIClientContext } from "@/contexts/apiClientContext"

export interface APIClientContextProviderProps {
    readonly value: APIClient
    readonly children?: ReactNode
}

export default function APIClientContextProvider({
    value,
    children,
}: APIClientContextProviderProps) {
    return <APIClientContext.Provider value={value}>{children}</APIClientContext.Provider>
}
