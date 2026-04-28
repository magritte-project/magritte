import { type ExtensionManifest } from "@magritte/sdk"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

import { ExtensionInstance } from "@/extensions/instance"

export type ExtensionManagerEvent =
    | { type: "extensionInstalled"; manifest: ExtensionManifest }
    | {
          type: "extensionInstanceAcquired"
          instance: ExtensionInstance
      }
    | {
          type: "extensionInstanceReleased"
          instance: ExtensionInstance
      }
    | { type: "extensionUninstalled"; manifest: ExtensionManifest }

export class ExtensionManager {
    private readonly _installed: Map<string, ExtensionManifest>
    private _instances: ExtensionInstance[]
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor() {
        this._installed = new Map()
        this._instances = []
        ;[this._events, this.$events] = createEvent()
    }

    readonly $events: EventStream<ExtensionManagerEvent>

    get installed(): Iterable<ExtensionManifest> {
        return this._installed.values()
    }

    install(manifest: ExtensionManifest) {
        if (this._installed.has(manifest.id)) {
            throw new Error(`Extension already installed: ${manifest.id}`)
        }
        this._installed.set(manifest.id, manifest)
        this._events.dispatch({ type: "extensionInstalled", manifest })
    }

    acquireInstance(id: string): ExtensionInstance {
        const manifest = this._installed.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not installed: ${id}`)
        }
        if (
            !manifest.allowsMultipleInstances &&
            this._instances.some((instance) => instance.manifest.id === id)
        ) {
            throw new Error(`Extension already has an instance: ${id}`)
        }
        const instance = new ExtensionInstance(manifest)
        this._instances.push(instance)
        this._events.dispatch({ type: "extensionInstanceAcquired", instance })
        return instance
    }

    releaseInstance(instance: ExtensionInstance) {
        const toRemove = this._instances.indexOf(instance)
        if (toRemove !== -1) {
            const instance = this._instances[toRemove]
            instance.unload()
            this._instances.splice(toRemove, 1)
            this._events.dispatch({ type: "extensionInstanceReleased", instance })
        }
    }

    uninstall(id: string) {
        const manifest = this._installed.get(id)
        if (manifest !== undefined) {
            for (const instance of this._instances) {
                if (instance.manifest.id === id) {
                    this.releaseInstance(instance)
                }
            }
            this._installed.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", manifest })
        }
    }
}
