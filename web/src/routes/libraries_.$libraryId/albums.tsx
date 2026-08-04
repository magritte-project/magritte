import type { LibraryAlbumInput } from "@magritte/sdk"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useInView } from "motion/react"
import { Fragment, useEffect, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibraryAlbums } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useSelection from "@/hooks/selectionHook"

export const Route = createFileRoute("/libraries_/$libraryId/albums")({
    validateSearch: z.object({
        query: z.string().optional(),
        artist_id: z.number().optional(),
    }),
    component: function LibraryAlbumsComponent() {
        const { libraryId } = Route.useParams()
        const { query, artist_id: artistId } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const api = useAPI()
        const {
            data: { pages },
            hasNextPage,
            fetchNextPage,
        } = useSuspenseInfiniteQuery(
            readLibraryAlbums(api, {
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
                                    placeholder={`Filter ${Intl.NumberFormat().format(total)} Albums...`}
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
                    <ol
                        className="flex items-start content-start justify-between flex-wrap gap-2"
                        style={{ minHeight: `calc(${total} * var(--spacing) * 47)` }}
                    >
                        {pages.map((page, index) => (
                            <Fragment key={`albums.pages[${index}`}>
                                {page.items.map((album) => (
                                    <li
                                        key={`albums.pages[${index}].albums[${album.id}]`}
                                        className="w-36 h-47 hover:bg-blue-50"
                                    >
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
                                            <span
                                                className="line-clamp-2 text-sm"
                                                title={album.title}
                                            >
                                                {album.title}
                                            </span>
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
