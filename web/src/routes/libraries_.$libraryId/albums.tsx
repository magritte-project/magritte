import { LibraryAlbumInput } from "@magritte/sdk"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useInView } from "motion/react"
import { Fragment, useMemo, useRef } from "react"
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
        const { data: firstPage } = useSuspenseQuery(
            readLibraryAlbums(api, {
                libraryId: Number(libraryId),
                artistId,
                query,
            }),
        )
        const pageOffsets = useMemo(() => {
            const length = Math.ceil((firstPage.total - firstPage.limit) / firstPage.limit)
            return Array.from({ length }, (_, i) =>
                Math.min(firstPage.limit * (i + 1), firstPage.total),
            )
        }, [firstPage])

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
                                    placeholder={`Find in ${Intl.NumberFormat().format(firstPage.total)} albums...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    {artistId !== undefined && (
                        <LibraryAlbumListAllSongsItem libraryId={libraryId} artistId={artistId} />
                    )}
                    <LibraryAlbumList>
                        {firstPage.items.map((album) => (
                            <LibraryAlbumListItem
                                key={`album[${album.id}]`}
                                libraryId={libraryId}
                                artistId={artistId}
                                album={album}
                                selected={isSelected(album.id)}
                                onToggleSelected={() => toggle(album.id)}
                            />
                        ))}
                        {pageOffsets.map((offset, index) => (
                            <AlbumPageFragment
                                key={`albums.pages[${index}]`}
                                isSelected={isSelected}
                                toggle={toggle}
                                offset={offset}
                                limit={firstPage.limit}
                            />
                        ))}
                    </LibraryAlbumList>
                </div>
            </CommandInputProvider>
        )
    },
})

interface AlbumPageFragmentProps {
    readonly isSelected: (id: number) => boolean
    readonly toggle: (id: number) => void
    readonly offset: number
    readonly limit: number
}

function AlbumPageFragment({ isSelected, toggle, offset, limit }: AlbumPageFragmentProps) {
    const { libraryId } = Route.useParams()
    const { query, artist_id: artistId } = Route.useSearch()

    const moreRef = useRef<HTMLLIElement | null>(null)
    const isMoreInView = useInView(moreRef)
    const enabled = useDebounce(isMoreInView, 300)

    const api = useAPI()
    const pageQuery = useQuery({
        ...readLibraryAlbums(api, {
            libraryId: Number(libraryId),
            artistId,
            query,
            offset,
        }),
        enabled,
    })

    return pageQuery.isSuccess ? (
        <Fragment>
            {pageQuery.data.items.map((album) => (
                <LibraryAlbumListItem
                    key={`album[${album.id}]`}
                    libraryId={libraryId}
                    artistId={artistId}
                    album={album}
                    selected={isSelected(album.id)}
                    onToggleSelected={() => toggle(album.id)}
                />
            ))}
        </Fragment>
    ) : (
        !pageQuery.isError && (
            <li ref={moreRef} style={{ minHeight: `calc(${limit} * var(--spacing) * 47)` }} />
        )
    )
}
