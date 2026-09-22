import type { API } from "@magritte/api"
import { LibraryInputSchema } from "@magritte/sdk"
import { DiscIcon } from "@phosphor-icons/react"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { SearchCommand, SearchCommandSection } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import type { Player } from "@/playback/player"
import ArrayQueue from "@/playback/queue/array"

export interface LibrarySongsSearchCommandOptions {
    readonly api: API
    readonly player: Player
    readonly router: RegisteredRouter
}

export class LibrarySongsSearchCommand implements SearchCommand {
    private readonly _api: API
    private readonly _player: Player
    private readonly _router: RegisteredRouter

    constructor({ api, player, router }: LibrarySongsSearchCommandOptions) {
        this._api = api
        this._player = player
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
        const librarySongs = await this._api.client.readLibrarySongs(libraryId, { query, limit: 5 })
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
                        : DiscIcon,
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
                    play: async () => {
                        await this._player.replaceQueue({
                            newQueue: new ArrayQueue(librarySongs.items),
                            startingItem: song,
                            playNow: true,
                        })
                    },
                    addToLibrary: async () => {
                        throw new Error("Already in library")
                    },
                })),
            },
        ]
    }
}
