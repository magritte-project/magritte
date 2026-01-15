import type { JsonStructure } from "react-cmdk"

import {
    isServiceOfType,
    type MetaService,
    type Service,
    type ServiceConstructorOptions,
    type ServiceOfType,
    type ServiceType,
} from "@/services/base"
import { createEvent, EventStream, type EventSink } from "@/utilities/events"

export type ServiceRegistryEvent =
    | { type: "serviceAdded"; name: string }
    | { type: "serviceRemoved"; name: string }

/** Manages the lifecycle of services and provides a means to work with all services at once */
export class ServiceRegistry {
    private readonly _options: ServiceConstructorOptions
    private readonly _services: Map<string, Service>
    private readonly _events: EventSink<ServiceRegistryEvent>

    constructor(options: ServiceConstructorOptions) {
        this._options = options
        this._services = new Map()
        ;[this._events, this.$events] = createEvent<ServiceRegistryEvent>()
    }

    readonly $events: EventStream<ServiceRegistryEvent>

    get commands(): JsonStructure {
        const commands: JsonStructure = []
        for (const service of this._services.values()) {
            commands.push(...service.commands)
        }
        return commands
    }

    services<TType extends ServiceType>(type: TType): ServiceOfType<TType>[] {
        const services: ServiceOfType<TType>[] = []
        for (const service of this._services.values()) {
            if (isServiceOfType(service, type)) {
                services.push(service)
            }
        }
        return services
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
            await this._events.dispatch({ type: "serviceAdded", name: metaService.name })
        }
        return service
    }

    async removeService<TType extends ServiceType>(
        metaService: MetaService<TType>,
    ): Promise<boolean> {
        const deleted = this._services.delete(metaService.name)
        await this._events.dispatch({ type: "serviceRemoved", name: metaService.name })
        return deleted
    }
}
