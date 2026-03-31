import type { JsonStructure } from "react-cmdk"

import {
    createEvent,
    EventStream,
    EventSubscription,
    type EventSink,
} from "@magritte/sdk/utilities"

import type {
    ExtensionInstanceEvent,
    ExtensionManager,
    ExtensionManagerEvent,
} from "@/extensions/extensionManager"
import type { PlaybackEngine } from "@/playback/engine"

import { ForwardingPlaybackEngine } from "@/components/extensions/forwardingEngine"
import {
    isServiceOfType,
    type MetaService,
    type Service,
    type ServiceConstructorOptions,
    type ServiceOfType,
    type ServiceType,
} from "@/services/base"

export type ServiceRegistryEvent =
    | { type: "serviceAdded"; service: Service }
    | { type: "serviceRemoved"; service: Service }

/** Manages the lifecycle of services and provides a means to work with all services at once */
export class ServiceRegistry {
    private readonly _options: ServiceConstructorOptions
    private readonly _services: Map<string, Service>
    private readonly _extensionSubscriptions: Map<string, EventSubscription<ExtensionInstanceEvent>>
    private readonly _events: EventSink<ServiceRegistryEvent>

    constructor(extensionManager: ExtensionManager, options: ServiceConstructorOptions) {
        this._options = { ...options }
        this._services = new Map()
        this._extensionSubscriptions = new Map()
        ;[this._events, this.$events] = createEvent<ServiceRegistryEvent>()

        extensionManager.$events.subscribe((event) => {
            this.handleExtensionEvent(event)
        })
    }

    readonly $events: EventStream<ServiceRegistryEvent>

    private handleExtensionEvent(event: ExtensionManagerEvent) {
        switch (event.type) {
            case "extensionInstanceAcquired": {
                const subscription = event.instance.$events.subscribe((event) => {
                    this.handleExtensionInstanceEvent(event)
                })
                this._extensionSubscriptions.set(event.instance.manifest.id, subscription)
                break
            }
            case "extensionInstanceReleased": {
                const subscription = this._extensionSubscriptions.get(event.instance.manifest.id)
                if (subscription !== undefined) {
                    subscription.unsubscribe()
                    this._extensionSubscriptions.delete(event.instance.manifest.id)
                }
                break
            }
            default:
                break
        }
    }

    private async handleExtensionInstanceEvent(event: ExtensionInstanceEvent) {
        switch (event.type) {
            case "extensionInstanceLoaded": {
                try {
                    const playbackEngine = new ForwardingPlaybackEngine(
                        event.instance,
                        await event.instance.extension.playbackEngine(),
                    )
                    await this.addService({
                        type: "streamingMusic",
                        name: event.instance.manifest.name,
                        construct: async () => ({
                            type: "streamingMusic",
                            name: event.instance.manifest.name,
                            commands: [],
                            playbackEngine,
                            searchSongs: async () => {
                                throw new Error("Not implemented")
                            },
                        }),
                    })
                } catch (error) {
                    console.debug(
                        "Failed to get playback engine for extension",
                        event.instance.manifest.id,
                        error,
                    )
                }
                break
            }
            case "extensionInstanceUnloaded": {
                const service = this._services.get(event.instance.manifest.name)
                if (service !== undefined) {
                    this._services.delete(event.instance.manifest.name)
                    await this._events.dispatch({ type: "serviceRemoved", service })
                }
                break
            }
            default:
                break
        }
    }

    get commands(): JsonStructure {
        const commands: JsonStructure = []
        for (const service of this._services.values()) {
            commands.push(...service.commands)
        }
        return commands
    }

    get playbackEngines(): readonly [string, PlaybackEngine][] {
        const streamingMusicServices = this.getAllServices("streamingMusic")
        return streamingMusicServices.flatMap((service) => {
            const playbackEngine = service.playbackEngine
            return playbackEngine ? [[service.name, playbackEngine]] : []
        })
    }

    getAllServices<TType extends ServiceType>(type: TType): ServiceOfType<TType>[] {
        const services: ServiceOfType<TType>[] = []
        for (const service of this._services.values()) {
            if (isServiceOfType(service, type)) {
                services.push(service)
            }
        }
        return services
    }

    getService<TType extends ServiceType>(name: string, type: TType): ServiceOfType<TType> | null {
        const service = this._services.get(name)
        if (service === undefined) {
            return null
        }
        if (!isServiceOfType(service, type)) {
            return null
        }
        return service
    }

    async addService<TType extends ServiceType>(
        metaService: MetaService<TType>,
    ): Promise<ServiceOfType<TType> | null> {
        if (this._services.has(metaService.name)) {
            throw new Error(`Service ${metaService.name} already exists`)
        }
        const service = await metaService.construct(this._options)
        if (service !== null) {
            this._services.set(metaService.name, service)
            await this._events.dispatch({ type: "serviceAdded", service })
        }
        return service
    }

    async removeService<TType extends ServiceType>(
        metaService: MetaService<TType>,
    ): Promise<boolean> {
        const service = this._services.get(metaService.name)
        if (service === undefined) {
            return false
        }
        this._services.delete(metaService.name)
        await this._events.dispatch({ type: "serviceRemoved", service })
        return true
    }
}
