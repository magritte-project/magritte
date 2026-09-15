import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Command } from "@/commands/base"

import CommandPalette from "./CommandPalette"

const catalogSearchCommand: Command = {
    id: "magritte.applemusic:catalog.search",
    searchTerms: "Apple Music search catalog streaming music songs",
    requiredInputKinds: [],
    view: { type: "catalogSearch", extensionId: "magritte.applemusic" },
    present: async () => ({ displayName: "Apple Music: Search…" }),
    execute: async () => {},
}

vi.mock("@/components/commands/CommandPaletteCatalogSearch", () => ({ default: () => null }))
vi.mock("@/components/commands/CommandPaletteOption", () => ({ default: () => null }))
vi.mock("@/hooks/commandInputsHook", () => ({ default: () => ({}) }))
vi.mock("@/hooks/commandsHook", () => ({ default: () => [] }))
vi.mock("@/hooks/commandRegistryHook", () => ({
    default: () => ({ all: [catalogSearchCommand] }),
}))
vi.mock("@/hooks/extensionRuntimeHook", () => ({
    default: () => ({ getRunning: () => ({ manifest: { name: "Apple Music" } }) }),
}))

describe("CommandPalette", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="app-cmdk"></div>'
    })

    it("offers to search streaming catalogs when no commands match", () => {
        render(
            <CommandPalette isOpen setIsOpen={() => {}} search="radiohead" setSearch={() => {}} />,
        )

        expect(screen.getByText("No commands found")).toBeTruthy()
        expect(screen.getByText(/Search Apple Music for “radiohead”/)).toBeTruthy()
    })
})
