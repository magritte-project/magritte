import type { RegisteredRouter } from "@tanstack/react-router"

import type { Command } from "@/commands/base"
import { LibraryInput } from "@/commands/inputs/libraryInput"

export function libraryCommands(router: RegisteredRouter): Command[] {
    return [
        {
            id: `libraries.artists`,
            searchTerms: "library artists",
            present: async (inputs) => ({
                displayName: "Go to Artists",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/artists",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.albums`,
            searchTerms: "library albums",
            present: async (inputs) => ({
                displayName: "Go to Albums",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/albums",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.songs`,
            searchTerms: "library songs",
            present: async (inputs) => ({
                displayName: "Go to Songs",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/songs",
                    params: { libraryId: String(library.id) },
                })
            },
        },
    ]
}
