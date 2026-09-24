import { RadioGroup } from "@headlessui/react"
import type { ArtworkRead } from "@magritte/api"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"
import { useCallback, useMemo, useState } from "react"

import { readLibraryAlbums } from "@/api/queries/libraries"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedRadio from "@/components/theme/ThemedRadio"
import ThemedSearchInput from "@/components/theme/ThemedSearchInput"
import { useFieldContext } from "@/contexts/formContext"
import useAPI from "@/hooks/apiHook"

export interface ArtworkSearchFieldProps {
    readonly libraryId: number
    readonly placeholder?: string
}

export default function ArtworkSearchField({
    libraryId,
    placeholder = "Search albums…",
}: ArtworkSearchFieldProps) {
    const field = useFieldContext<ArtworkRead | null>()
    const [immediateQuery, setImmediateQuery] = useState("")
    const [offset, setOffset] = useState(0)
    const query = useDebounce(immediateQuery, 300)
    const api = useAPI()
    const libraryAlbumsQuery = useQuery({
        ...readLibraryAlbums(api, { libraryId, query, offset, limit: 10 }),
        enabled: query.length > 0,
    })
    const artworks = useMemo(() => {
        const items = libraryAlbumsQuery.data?.items ?? []
        const uniqueArtworks = new Map<number, ArtworkRead>()
        if (field.state.value) {
            uniqueArtworks.set(field.state.value.id, field.state.value)
        }
        for (const album of items) {
            if (!album.artworks) {
                continue
            }
            for (const artwork of album.artworks) {
                uniqueArtworks.set(artwork.id, artwork)
            }
        }
        return Array.from(uniqueArtworks.values())
    }, [field.state.value, libraryAlbumsQuery])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setImmediateQuery(e.target.value)
    }, [])

    return (
        <div className="flex flex-col gap-between">
            <ThemedSearchInput
                className="w-full"
                id={`${field.name}.input`}
                name={`${field.name}.input`}
                placeholder={placeholder}
                value={immediateQuery}
                onChange={handleChange}
            />
            <RadioGroup
                className="flex items-start flex-wrap gap-between"
                value={field.state.value}
                onChange={field.handleChange}
            >
                <ArtworkImage
                    className="h-16 w-16"
                    accessory={
                        <ThemedRadio
                            className="absolute left-2 bottom-2"
                            value={null}
                            onClick={(e) => e.stopPropagation()}
                        />
                    }
                />
                {artworks.map((artwork, index) => (
                    <ArtworkImage
                        key={`artworks[${artwork.id}@${index}]`}
                        className="h-16 w-16"
                        artworks={[artwork]}
                        accessory={
                            <ThemedRadio
                                className="absolute left-2 bottom-2"
                                value={artwork}
                                onClick={(e) => e.stopPropagation()}
                            />
                        }
                    />
                ))}
            </RadioGroup>
            {libraryAlbumsQuery.isSuccess && (
                <TableFooter
                    className="self-center"
                    singularLabel="Extension"
                    pluralLabel="Extensions"
                    offset={libraryAlbumsQuery.data.offset}
                    limit={libraryAlbumsQuery.data.limit}
                    total={libraryAlbumsQuery.data.total}
                    onChange={(offset, _limit) => setOffset(offset)}
                />
            )}
        </div>
    )
}
