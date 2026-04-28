import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { FunnelSimpleIcon } from "@phosphor-icons/react"
import { useCallback } from "react"

import SortControl from "@/components/reusable/SortControl"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { resolveNewValue } from "@/utilities/react"
import { type SortableKey } from "@/utilities/sorting"

const KEYS = [
    "artist_name",
    "album_title",
    "title",
    "album_artist",
    "composer",
    "genre",
    "release_date",
    "track_number",
    "track_total",
    "disc_number",
    "disc_total",
    "rating",
    "bpm",
    "grouping",
] as const

type SongKey = (typeof KEYS)[number]

const KEY_LABELS: Record<SongKey, string> = {
    artist_name: "Artist",
    album_title: "Album",
    title: "Title",
    album_artist: "Album Artist",
    composer: "Composer",
    genre: "Genre",
    release_date: "Release Date",
    track_number: "Track Number",
    track_total: "Track Total",
    disc_number: "Disc Number",
    disc_total: "Disc Total",
    rating: "Rating",
    bpm: "BPM",
    grouping: "Grouping",
}

export type SongSortKey = SortableKey<SongKey>

const DEFAULT_ORDER: SongSortKey[] = [
    "+artist_name",
    "+album_title",
    "+disc_number",
    "+track_number",
]

export interface SongSortButtonProps {
    readonly order?: SongSortKey[]
    readonly setOrder: React.Dispatch<React.SetStateAction<SongSortKey[] | undefined>>
}

export default function SongSortButton({ order = DEFAULT_ORDER, setOrder }: SongSortButtonProps) {
    const handleSetOrder = useCallback(
        (newValue: React.SetStateAction<SongSortKey[]>) => {
            setOrder((oldValue) => {
                return resolveNewValue(oldValue ?? DEFAULT_ORDER, newValue)
            })
        },
        [setOrder],
    )

    return (
        <Popover className="relative">
            <ThemedSubtleButton buttonComponent={PopoverButton} className="flex items-center gap-1">
                <FunnelSimpleIcon aria-label="Sort" />
            </ThemedSubtleButton>
            <PopoverPanel
                anchor="bottom end"
                className="w-3xs bg-white rounded-md shadow-sm flex flex-col p-4"
            >
                <SortControl<SongKey>
                    keys={KEYS}
                    labels={KEY_LABELS}
                    order={order}
                    setOrder={handleSetOrder}
                />
            </PopoverPanel>
        </Popover>
    )
}
