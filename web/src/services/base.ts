import type { APIClient } from "@/api/client"
import type { IngestSong } from "@/api/openapi"
import type { UserSessionManager } from "@/api/userSession"
import type { CommandRegistry } from "@/commands/registry"
import type { PlaybackEngine } from "@/playback/engine"

export interface BaseService {
    /** Unique ID for the group this service belongs to */
    readonly groupID: string

    /** The unique name of the service, human readable */
    readonly name: string

    /** Tear down the service, releasing any resources */
    deconstruct(): void
}

export interface CommandsService extends BaseService {
    readonly type: "commands"
}

export interface PlaybackService extends BaseService {
    readonly type: "playback"

    /** This service's playback engine */
    readonly playbackEngine: PlaybackEngine
}

export interface SongSearchService extends BaseService {
    readonly type: "songSearch"

    /** Search this music service's catalog for songs */
    searchSongs(
        query: string,
        offset?: number,
        limit?: number,
    ): Promise<StreamingMusicServiceSongsRead>
}

export interface StreamingMusicServiceSongRead extends IngestSong {
    readonly id: unknown
}

export interface StreamingMusicServiceSongsRead {
    readonly items: readonly StreamingMusicServiceSongRead[]
    readonly offset: number
    readonly limit: number
}

/** Union of all supported types of services */
export type Service = CommandsService | PlaybackService | SongSearchService

/** All types of services */
export type ServiceType = Service["type"]

/** Utility to downcast `Service` to a specific subtype */
export type ServiceOfType<TType extends ServiceType> = Extract<Service, { type: TType }>

/** Attempt to cast a service down to a specific type */
export function isServiceOfType<TType extends ServiceType>(
    service: Service,
    type: TType,
): service is ServiceOfType<TType> {
    return service.type === type
}

/** Options passed when constructing services */
export interface ServiceConstructorOptions {
    readonly apiClient: APIClient
    readonly userSession: UserSessionManager
    readonly commandRegistry: CommandRegistry
}

export interface ServiceGroup {
    /** The unique identifier of the service group */
    readonly id: string

    /** Attempt to construct services with the given options */
    construct(context: ServiceConstructorOptions): Promise<readonly Service[]>
}

export interface MetaService<TType extends ServiceType> {
    /** The type of service which can be constructed */
    readonly type: TType

    /** The unique name of the service, human readable */
    readonly name: string

    /** Attempt to construct a new service with the given options */
    construct(context: ServiceConstructorOptions): Promise<ServiceOfType<TType> | null>
}
