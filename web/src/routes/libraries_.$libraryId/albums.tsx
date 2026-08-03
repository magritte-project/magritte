import type { LibraryAlbumInput } from "@magritte/sdk"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { z } from "zod"

import { readLibraryAlbums } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import TableFooter from "@/components/reusable/TableFooter"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useSelection from "@/hooks/selectionHook"

export const Route = createFileRoute("/libraries_/$libraryId/albums")({
    validateSearch: z.object({
        query: z.string().optional(),
        artist_id: z.number().optional(),
        offset: z.number().optional(),
    }),
    component: function LibraryAlbumsComponent() {
        const { libraryId } = Route.useParams()
        const { query, artist_id: artistId, offset } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const { client } = useAPI()
        const { data: page } = useSuspenseQuery(
            readLibraryAlbums(client, {
                libraryId: Number(libraryId),
                query,
                artistId,
                offset,
            }),
        )

        const { selection, isSelected, toggle } = useSelection()
        const commandInputs = useMemo(() => {
            return Array.from(
                selection,
                (id) => ({ kind: "library.album", id }) satisfies LibraryAlbumInput,
            )
        }, [selection])

        const facetForm = useAppForm({
            defaultValues: {
                query,
            },
            onSubmit({ value }) {
                navigate({ search: (oldSearch) => ({ ...oldSearch, ...value, offset: undefined }) })
            },
        })

        return (
            <CommandInputProvider value={commandInputs}>
                <div className="m-2 flex flex-col gap-2">
                    <AppForm form={facetForm}>
                        <facetForm.AppField name="query">
                            {(field) => (
                                <field.InputField
                                    className="w-full"
                                    type="search"
                                    placeholder="Filter Albums..."
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    {artistId !== undefined && (
                        <Link
                            to="/libraries/$libraryId/songs"
                            params={{ libraryId }}
                            search={{ artist_id: artistId }}
                            className="px-2 py-1 hover:bg-blue-50"
                        >
                            All Songs
                        </Link>
                    )}
                    <ol className="flex items-start flex-wrap gap-2">
                        {page.items.map((album) => (
                            <li key={`album-${album.id}`} className="w-36 hover:bg-blue-50">
                                <Link
                                    to="/libraries/$libraryId/songs"
                                    params={{ libraryId }}
                                    search={{
                                        artist_id: artistId,
                                        album_id: album.id,
                                    }}
                                    title={album.title}
                                >
                                    <ArtworkImage
                                        className="h-36 w-36"
                                        artworks={album.artworks}
                                        itemTitle={album.title}
                                        accessory={
                                            <input
                                                className="absolute left-2 bottom-2"
                                                type="checkbox"
                                                name={`albums[${album.id}]`}
                                                checked={isSelected(album.id)}
                                                onChange={() => toggle(album.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        }
                                    />
                                    <span className="line-clamp-2">{album.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                    <TableFooter
                        className="self-center"
                        singularLabel="Album"
                        pluralLabel="Albums"
                        offset={page.offset}
                        limit={page.limit}
                        total={page.total}
                        onChange={(offset, _limit) =>
                            navigate({
                                search: (oldSearch) => ({
                                    ...oldSearch,
                                    offset,
                                }),
                            })
                        }
                    />
                </div>
            </CommandInputProvider>
        )
    },
})
