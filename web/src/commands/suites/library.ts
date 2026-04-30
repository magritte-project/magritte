import type { RegisteredRouter } from "@tanstack/react-router"

import type { CommandDefinition } from "@/commands/definition"

import { LibraryInput } from "@/commands/inputs/libraryInput"

export function libraryCommands(router: RegisteredRouter): CommandDefinition[] {
    return [
        {
            id: `libraries.artists`,
            searchTerms: "library artists",
            displayName: () => "Go to Artists",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
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
            displayName: () => "Go to Albums",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
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
            displayName: () => "Go to Songs",
            disabled: (inputs) => !inputs.hasAny("library", LibraryInput),
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
