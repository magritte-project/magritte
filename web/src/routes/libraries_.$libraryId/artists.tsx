import type { LibraryArtistInput } from "@magritte/sdk"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"
import { z } from "zod"

import { readLibraryArtists } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import TableFooter from "@/components/reusable/TableFooter"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"
import useSelection from "@/hooks/selectionHook"

export const Route = createFileRoute("/libraries_/$libraryId/artists")({
    validateSearch: z.object({
        query: z.string().optional(),
        offset: z.number().optional(),
    }),
    component: function LibraryArtistsComponent() {
        const { libraryId } = Route.useParams()
        const { query, offset } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const apiClient = useAPIClient()
        const { data: page } = useSuspenseQuery(
            readLibraryArtists(apiClient, {
                libraryId: Number(libraryId),
                query,
                offset,
            }),
        )

        const { selection, isSelected, toggle } = useSelection()
        const commandInputs = useMemo(() => {
            return Array.from(
                selection,
                (id) => ({ kind: "library.artist", id }) satisfies LibraryArtistInput,
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
                                    placeholder="Filter Artists..."
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    <ol className="flex flex-col">
                        {page.items.map((artist) => (
                            <li
                                key={`artist-${artist.id}`}
                                className=" bg-gray-50 odd:bg-inherit hover:bg-blue-50 flex items-center gap-2 px-2 py-1"
                            >
                                <input
                                    type="checkbox"
                                    name={`artists[${artist.id}]`}
                                    checked={isSelected(artist.id)}
                                    onChange={() => toggle(artist.id)}
                                />
                                <Link
                                    to="/libraries/$libraryId/albums"
                                    params={{ libraryId }}
                                    search={{ artist_id: artist.id }}
                                    className="flex-1 cursor-pointer"
                                >
                                    {artist.name}
                                </Link>
                            </li>
                        ))}
                    </ol>
                    <TableFooter
                        className="self-center"
                        singularLabel="Artist"
                        pluralLabel="Artists"
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
