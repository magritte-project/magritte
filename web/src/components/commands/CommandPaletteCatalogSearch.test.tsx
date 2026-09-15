import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import CommandPaletteCatalogSearch from "./CommandPaletteCatalogSearch"

const replaceQueue = vi.fn(async (_options: unknown) => {})
const ingestSongs = vi.fn(async (_libraryId: number, _body: unknown) => [])

const song = {
    start_time: 0,
    end_time: 200,
    sources: [{ url: "applemusic:///songs/1", mime_type: null }],
    artworks: [],
    title: "Song",
    artist_name: "Artist",
    album_title: "Album",
}

vi.mock("@/components/reusable/ArtworkImage", () => ({ default: () => null }))
vi.mock("@/hooks/apiHook", () => ({
    default: () => ({
        client: { readLibraries: async () => [{ id: 7, name: "Lib" }], ingestSongs },
    }),
}))
vi.mock("@/hooks/commandInputsHook", () => ({ default: () => ({ allOf: () => [] }) }))
vi.mock("@/hooks/playerHook", () => ({ default: () => ({ replaceQueue }) }))
vi.mock("@/hooks/notificationCenterHook", () => ({ default: () => ({ showToast: vi.fn() }) }))
vi.mock("@/hooks/extensionRuntimeHook", () => ({
    default: () => ({
        getRunning: () => ({
            manifest: { name: "Apple Music" },
            catalogSearcher: async () => ({
                searchCatalog: async () => ({ songs: [{ id: "1", song }] }),
            }),
        }),
    }),
}))

async function renderWithResults() {
    const onClose = vi.fn()
    render(
        <QueryClientProvider client={new QueryClient()}>
            <CommandPaletteCatalogSearch extensionId="x" onBack={() => {}} onClose={onClose} />
        </QueryClientProvider>,
    )
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "song" } })
    await screen.findByTitle("Play Now")
    await screen.findByTitle("Add to Lib")
    return { onClose }
}

describe("CommandPaletteCatalogSearch", () => {
    it("plays a result as the starting item of a new queue", async () => {
        const { onClose } = await renderWithResults()

        fireEvent.click(screen.getByTitle("Play Now"))

        await waitFor(() => expect(replaceQueue).toHaveBeenCalled())
        expect(onClose).toHaveBeenCalled()
        expect(replaceQueue.mock.calls[0][0]).toMatchObject({
            startingItem: { id: "1", title: "Song" },
            playNow: true,
        })
    })

    it("adds a result to a library", async () => {
        await renderWithResults()

        fireEvent.click(screen.getByTitle("Add to Lib"))

        await waitFor(() => expect(ingestSongs).toHaveBeenCalledWith(7, { songs: [song] }))
    })
})
