import type { QueueItemContext } from "./base"

import { PlaybackModes } from "../modes"

export interface TestItem {
    readonly id: string
}

export function mockTestItem(): TestItem {
    return { id: crypto.randomUUID() }
}

export const mockQueueItemContext: QueueItemContext<TestItem["id"]> = {
    getPlaybackModes: async () => PlaybackModes.default,
    hasPlayedItem: async (_itemId: string) => false,
}
