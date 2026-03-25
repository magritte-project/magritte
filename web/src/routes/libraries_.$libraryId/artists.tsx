import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { readLibraryArtists } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import TableFooter from "@/components/reusable/TableFooter"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"

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

        const facetForm = useAppForm({
            defaultValues: {
                query,
            },
            onSubmit({ value }) {
                navigate({ search: (oldSearch) => ({ ...oldSearch, ...value, offset: undefined }) })
            },
        })

        return (
            <div className="m-2 flex flex-col gap-2">
                <AppForm form={facetForm}>
                    <facetForm.AppField name="query">
                        {(field) => (
                            <field.InputField
                                className="w-full"
                                type="search"
                                placeholder="Filter Songs..."
                            />
                        )}
                    </facetForm.AppField>
                </AppForm>

                <ol>
                    {page.items.map((artist) => (
                        <li
                            key={`artist-${artist.id}`}
                            className="px-2 py-1 bg-gray-50 odd:bg-inherit hover:bg-blue-50 cursor-pointer"
                        >
                            <Link
                                to="/libraries/$libraryId/albums"
                                params={{ libraryId }}
                                search={{ artist_id: artist.id }}
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
        )
    },
})
