import {
    createEvent,
    EventStream,
    EventSubscription,
    type EventSink,
} from "@magritte/sdk/utilities"

import type { ExtensionInstanceEvent } from "@/extensions/instance"
import type { ExtensionManager, ExtensionManagerEvent } from "@/extensions/manager"
import type { PlaybackEngine } from "@/playback/engine"

import { ExtensionPlaybackEngineProxy } from "@/extensions/playbackEngine"
import {
    isServiceOfType,
    type Service,
    type ServiceConstructorOptions,
    type ServiceGroup,
    type ServiceOfType,
    type ServiceType,
} from "@/services/base"

export type ServiceRegistryEvent =
    | { type: "serviceAdded"; service: Service }
    | { type: "serviceRemoved"; service: Service }

/** Manages the lifecycle of services and provides a means to work with all services at once */
export class ServiceRegistry {
    private readonly _options: ServiceConstructorOptions
    private readonly _groupsByID: Map<string, ServiceGroup>
    private readonly _services: Service[]
    private readonly _extensionSubscriptions: Map<string, EventSubscription<ExtensionInstanceEvent>>
    private readonly _events: EventSink<ServiceRegistryEvent>

    constructor(extensionManager: ExtensionManager, options: ServiceConstructorOptions) {
        this._options = { ...options }
        this._groupsByID = new Map()
        this._services = []
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
                    const playbackEngine = new ExtensionPlaybackEngineProxy(
                        event.instance,
                        await event.instance.extension.playbackEngine(),
                    )
                    await this.addServiceGroup({
                        id: event.instance.manifest.id,
                        construct: async () => [
                            {
                                type: "playback",
                                groupID: event.instance.manifest.id,
                                name: event.instance.manifest.name,
                                playbackEngine,
                                deconstruct: () => {},
                            },
                        ],
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
                this.removeServiceGroup(event.instance.manifest.id)
                break
            }
            default:
                break
        }
    }

    get playbackEngines(): readonly [string, PlaybackEngine][] {
        const streamingMusicServices = this.getServicesOfType("playback")
        return streamingMusicServices.map(({ name, playbackEngine }) => [name, playbackEngine])
    }

    getServicesOfType<TType extends ServiceType>(type: TType): readonly ServiceOfType<TType>[] {
        const services: ServiceOfType<TType>[] = []
        for (const service of this._services) {
            if (isServiceOfType(service, type)) {
                services.push(service)
            }
        }
        return services
    }

    async addServiceGroup(group: ServiceGroup) {
        if (this._groupsByID.has(group.id)) {
            throw new Error(`Service group ${group.id} already exists`)
        }
        const services = await group.construct(this._options)
        if (services.length > 0) {
            for (const service of services) {
                if (service.groupID !== group.id) {
                    console.warn(
                        "*** Discarding new service whose group ID does not match its parent",
                        service,
                        group,
                    )
                    continue
                }
                this._services.push(service)
                await this._events.dispatch({ type: "serviceAdded", service })
            }
        }
    }

    async removeServiceGroup(groupID: string) {
        if (!this._groupsByID.has(groupID)) {
            return false
        }
        for (let i = this._services.length - 1; i >= 0; i--) {
            if (this._services[i].groupID === groupID) {
                const [service] = this._services.splice(i, 1)
                await this._events.dispatch({ type: "serviceRemoved", service })
                service.deconstruct()
            }
        }
        this._groupsByID.delete(groupID)
        return true
    }
}
