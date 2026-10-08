import { createContext } from "react"

import type { LookupCache } from "@/youtube/cache"
import type { YouTubeClient } from "@/youtube/client"

export interface YouTube {
    readonly client: YouTubeClient
    readonly cache: LookupCache
}

export const YouTubeContext = createContext<YouTube | undefined>(undefined)
