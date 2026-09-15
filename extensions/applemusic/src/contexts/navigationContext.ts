import { createContext } from "react"

import type { RecentKind } from "@/api/queries/recent"
import type { CollectionKind } from "@/musickit/models/collection"

export type Route =
    | { readonly kind: "home" }
    | { readonly kind: "search"; readonly query: string }
    | { readonly kind: "settings" }
    | { readonly kind: "recent"; readonly recent: RecentKind }
    | { readonly kind: "artist"; readonly id: string; readonly name?: string }
    | {
          readonly kind: "collection"
          readonly collectionKind: CollectionKind
          readonly id: string
          readonly name?: string
      }

export interface Navigation {
    readonly canGoBack: boolean
    push(route: Route): void
    pop(): void
}

export const NavigationContext = createContext<Navigation | undefined>(undefined)
