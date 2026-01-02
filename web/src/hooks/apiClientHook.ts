import { useContext } from "react"

import type { APIClient } from "@/api/client"

import { APIClientContext } from "@/contexts/apiClientContext"

export default function useAPIClient(): APIClient {
    const apiClient = useContext(APIClientContext)
    if (apiClient === undefined) {
        throw new Error("useAPIClient() used outside of <APIClientContextProvider>")
    }
    return apiClient
}
