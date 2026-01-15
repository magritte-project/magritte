import type { JsonStructure } from "react-cmdk"

import type { APIClient } from "@/api/client"
import type { IngestSong, InstanceStatusRead } from "@/api/openapi"

export interface ServiceInitializerContext {
    readonly apiClient: APIClient
    readonly instanceStatus: InstanceStatusRead
}

export type ServiceCommands = () => JsonStructure

export interface BaseService {
    readonly commands: JsonStructure
}

export interface StreamingMusicService extends BaseService {
    readonly type: "streamingMusic"
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

export type Service = StreamingMusicService
export type ServiceType = Service["type"]
export type ServiceOfType<TType extends ServiceType> = Extract<Service, { type: TType }>

export function isServiceOfType<TType extends ServiceType>(
    service: Service,
    type: TType,
): service is ServiceOfType<TType> {
    return service.type === type
}

export type ServiceInitializer = (context: ServiceInitializerContext) => Promise<Service>
