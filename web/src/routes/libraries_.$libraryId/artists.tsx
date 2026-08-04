import type { LibraryArtistInput } from "@magritte/sdk"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useInView } from "motion/react"
import { Fragment, useEffect, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibraryArtists } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useSelection from "@/hooks/selectionHook"

export const Route = createFileRoute("/libraries_/$libraryId/artists")({
    validateSearch: z.object({
        query: z.string().optional(),
    }),
    component: function LibraryArtistsComponent() {
        const { libraryId } = Route.useParams()
        const { query } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const api = useAPI()
        const {
            data: { pages },
            hasNextPage,
            fetchNextPage,
        } = useSuspenseInfiniteQuery(
            readLibraryArtists(api, {
                libraryId: Number(libraryId),
                query,
            }),
        )
        const total = pages.length > 0 ? pages[0].total : 0
        const moreRef = useRef<HTMLLIElement | null>(null)
        const isMoreInView = useInView(moreRef)
        useEffect(() => {
            if (isMoreInView && hasNextPage) {
                fetchNextPage()
            }
        }, [isMoreInView, hasNextPage, fetchNextPage])

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
                navigate({ search: (oldSearch) => ({ ...oldSearch, ...value }) })
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
                                    placeholder={`Filter ${Intl.NumberFormat().format(total)} Artists...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    <ol
                        className="flex flex-col"
                        style={{ minHeight: `calc(${total} * var(--spacing) * 9)` }}
                    >
                        {pages.map((page, index) => (
                            <Fragment key={`artists.pages[${index}`}>
                                {page.items.map((artist) => (
                                    <li
                                        key={`artists.pages[${index}].artist[${artist.id}]`}
                                        className=" bg-gray-50 odd:bg-inherit hover:bg-blue-50 flex items-center gap-2 px-2 py-1 h-9"
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
                            </Fragment>
                        ))}
                        <li ref={moreRef} />
                    </ol>
                </div>
            </CommandInputProvider>
        )
    },
})
