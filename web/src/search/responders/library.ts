import type { API } from "@magritte/api"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { CommandInputs } from "@/commands/inputs/base"
import type { NotificationCenter } from "@/notifications/center"
import type { Player } from "@/playback/player"

export interface LibrarySearchResponderOptions {
    readonly router: RegisteredRouter
    readonly api: API
    readonly player: Player
    readonly commandInputs: CommandInputs
    readonly notificationCenter: NotificationCenter
}

export function buildLibraryID(libraryId: number, entityType: string, entityId: number): string {
    return `library_${libraryId}:${entityType}_${entityId}`
}

export function parseLibraryID(id: string): {
    libraryId: number
    entityType: string
    entityId: number
} {
    const [libraryId, entityType, entityId] = id.split(":").map((part) => part.split("_")[1])
    return { libraryId: parseInt(libraryId, 10), entityType, entityId: parseInt(entityId, 10) }
}
