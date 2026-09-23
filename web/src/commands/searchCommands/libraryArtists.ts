import type { API } from "@magritte/api"
import { LibraryInputSchema } from "@magritte/sdk"
import { MicrophoneStageIcon } from "@phosphor-icons/react"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { SearchCommand, SearchCommandSection } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"

export interface LibraryArtistsSearchCommandOptions {
    readonly api: API
    readonly router: RegisteredRouter
}

export class LibraryArtistsSearchCommand implements SearchCommand {
    private readonly _api: API
    private readonly _router: RegisteredRouter

    constructor({ api, router }: LibraryArtistsSearchCommandOptions) {
        this._api = api
        this._router = router
    }

    get id(): string {
        return "magritte.libraryArtists"
    }

    get requiredInputKinds(): readonly string[] {
        return ["library"]
    }

    async search(query: string, inputs: CommandInputs): Promise<SearchCommandSection[]> {
        const libraryInputs = inputs.allOf(LibraryInputSchema)
        if (libraryInputs.length === 0) {
            return []
        }
        const libraryId = libraryInputs[0].id
        const libraryArtists = await this._api.client.readLibraryArtists(libraryId, {
            query,
            limit: 5,
        })
        return [
            {
                displayName: "Artists",
                items: libraryArtists.items.map((artist) => ({
                    id: String(artist.id),
                    icon: MicrophoneStageIcon,
                    title: artist.name,
                    reveal: async () => {
                        this._router.navigate({
                            to: "/libraries/$libraryId/songs",
                            params: { libraryId: String(libraryId) },
                            search: {
                                artist_id: artist.id,
                            },
                        })
                    },
                    play: async () => {
                        throw new Error("Choose song from artist to play")
                    },
                })),
            },
        ]
    }
}
