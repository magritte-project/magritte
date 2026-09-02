import { LibraryAlbumInput } from "@magritte/sdk"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useInView } from "motion/react"
import { Fragment, useEffect, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibraryAlbums } from "@/api/queries/libraries"
import LibraryAlbumList from "@/components/library/LibraryAlbumList"
import LibraryAlbumListAllSongsItem from "@/components/library/LibraryAlbumListAllSongsItem"
import LibraryAlbumListItem from "@/components/library/LibraryAlbumListItem"
import AppForm from "@/components/reusable/AppForm"
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
                artistId,
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
                                    placeholder={`Filter ${Intl.NumberFormat().format(total)} Albums...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    {artistId !== undefined && (
                        <LibraryAlbumListAllSongsItem libraryId={libraryId} artistId={artistId} />
                    )}
                    <LibraryAlbumList style={{ minHeight: `calc(${total} * var(--spacing) * 47)` }}>
                        {pages.map((page, index) => (
                            <Fragment key={`albums.pages[${index}`}>
                                {page.items.map((album) => (
                                    <LibraryAlbumListItem
                                        key={`albums.pages[${index}].albums[${album.id}]`}
                                        libraryId={libraryId}
                                        artistId={artistId}
                                        album={album}
                                        selected={isSelected(album.id)}
                                        onToggleSelected={() => toggle(album.id)}
                                    />
                                ))}
                            </Fragment>
                        ))}
                        <li ref={moreRef} />
                    </LibraryAlbumList>
                </div>
            </CommandInputProvider>
        )
    },
})
