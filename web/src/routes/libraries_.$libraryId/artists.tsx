import type { LibraryArtistInput } from "@magritte/sdk"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useInView } from "motion/react"
import { Fragment, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibraryArtists } from "@/api/queries/libraries"
import LibraryArtistList from "@/components/library/LibraryArtistList"
import LibraryArtistListItem from "@/components/library/LibraryArtistListItem"
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
        const { data: firstPage } = useSuspenseQuery(
            readLibraryArtists(api, {
                libraryId: Number(libraryId),
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
                                    placeholder={`Find ${Intl.NumberFormat().format(firstPage.total)} Artists...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>

                    <LibraryArtistList>
                        {firstPage.items.map((artist) => (
                            <LibraryArtistListItem
                                key={`artist[${artist.id}]`}
                                libraryId={libraryId}
                                artist={artist}
                                selected={isSelected(artist.id)}
                                onToggleSelected={() => toggle(artist.id)}
                            />
                        ))}
                        {pageOffsets.map((offset, index) => (
                            <ArtistPageFragment
                                key={`artists.pages[${index}]`}
                                libraryId={libraryId}
                                isSelected={isSelected}
                                toggle={toggle}
                                query={query}
                                offset={offset}
                                limit={firstPage.limit}
                            />
                        ))}
                    </LibraryArtistList>
                </div>
            </CommandInputProvider>
        )
    },
})

interface ArtistPageFragmentProps {
    readonly libraryId: string
    readonly isSelected: (id: number) => boolean
    readonly toggle: (id: number) => void
    readonly query?: string
    readonly offset: number
    readonly limit: number
}

function ArtistPageFragment({
    libraryId,
    isSelected,
    toggle,
    query,
    offset,
    limit,
}: ArtistPageFragmentProps) {
    const moreRef = useRef<HTMLLIElement | null>(null)
    const isMoreInView = useInView(moreRef)
    const enabled = useDebounce(isMoreInView, 300)

    const api = useAPI()
    const pageQuery = useQuery({
        ...readLibraryArtists(api, {
            libraryId: Number(libraryId),
            query,
            offset,
        }),
        enabled,
    })

    return pageQuery.isSuccess ? (
        <Fragment>
            {pageQuery.data.items.map((artist) => (
                <LibraryArtistListItem
                    key={`artist[${artist.id}]`}
                    libraryId={libraryId}
                    artist={artist}
                    selected={isSelected(artist.id)}
                    onToggleSelected={() => toggle(artist.id)}
                />
            ))}
        </Fragment>
    ) : (
        !pageQuery.isError && (
            <li ref={moreRef} style={{ minHeight: `calc(${limit} * var(--spacing) * 9)` }} />
        )
    )
}
