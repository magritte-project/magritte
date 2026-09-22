import type { API } from "@magritte/api"
import { LibraryInputSchema } from "@magritte/sdk"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { SearchCommand, SearchCommandSection } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"

export interface LibrarySongsSearchResponderOptions {
    readonly api: API
    readonly router: RegisteredRouter
}

export class LibrarySongsSearchResponder implements SearchCommand {
    private readonly _api: API
    private readonly _router: RegisteredRouter

    constructor({ api, router }: LibrarySongsSearchResponderOptions) {
        this._api = api
        this._router = router
    }

    get id(): string {
        return "magritte.librarySongs"
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
        const librarySongs = await this._api.client.readLibrarySongs(libraryId, { query })
        return [
            {
                displayName: "Songs",
                items: librarySongs.items.map((song) => ({
                    id: String(song.id),
                    icon: song.artworks?.length
                        ? {
                              url: song.artworks[0].image_url,
                              alt: "Album Artwork",
                              appearance: "square",
                          }
                        : undefined,
                    title: song.title ?? "--",
                    subtitle: `${song.album_title ?? "--"} by ${song.artist_name ?? "--"}`,
                    reveal: async () => {
                        this._router.navigate({
                            to: "/libraries/$libraryId/songs",
                            params: { libraryId: String(libraryId) },
                            search: {
                                artist_id: song.artist_id ?? undefined,
                                album_id: song.album_id ?? undefined,
                            },
                        })
                    },
                })),
            },
        ]
    }
}
