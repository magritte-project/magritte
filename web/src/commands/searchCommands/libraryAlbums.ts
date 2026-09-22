import type { API } from "@magritte/api"
import { LibraryInputSchema } from "@magritte/sdk"
import { DiscIcon } from "@phosphor-icons/react"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { SearchCommand, SearchCommandSection } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"

export interface LibraryAlbumsSearchCommandOptions {
    readonly api: API
    readonly router: RegisteredRouter
}

export class LibraryAlbumsSearchCommand implements SearchCommand {
    private readonly _api: API
    private readonly _router: RegisteredRouter

    constructor({ api, router }: LibraryAlbumsSearchCommandOptions) {
        this._api = api
        this._router = router
    }

    get id(): string {
        return "magritte.libraryAlbums"
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
        const libraryAlbums = await this._api.client.readLibraryAlbums(libraryId, {
            query,
            limit: 5,
        })
        return [
            {
                displayName: "Albums",
                items: libraryAlbums.items.map((album) => ({
                    id: String(album.id),
                    icon: album.artworks?.length
                        ? {
                              url: album.artworks[0].image_url,
                              alt: "Album Artwork",
                              appearance: "square",
                          }
                        : DiscIcon,
                    title: album.title ?? "--",
                    reveal: async () => {
                        this._router.navigate({
                            to: "/libraries/$libraryId/songs",
                            params: { libraryId: String(libraryId) },
                            search: {
                                artist_id: album.artist_id ?? undefined,
                                album_id: album.id ?? undefined,
                            },
                        })
                    },
                    play: async () => {
                        throw new Error("Choose song from album to play")
                    },
                    addToLibrary: async () => {
                        throw new Error("Already in library")
                    },
                })),
            },
        ]
    }
}
