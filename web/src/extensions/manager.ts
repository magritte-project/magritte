import { type ExtensionManifest } from "@magritte/sdk"
import {
    ExtensionCoordinator,
    ExtensionInstance,
    type ExtensionAcquisitionResult,
    type ExtensionInstanceOptions,
} from "@magritte/sdk/connection"
import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"

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
    private readonly _coordinator: ExtensionCoordinator
    private readonly _events: EventSink<ExtensionManagerEvent>

    constructor() {
        this._installed = new Map()
        this._coordinator = new ExtensionCoordinator()
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

    acquireInstance(id: string): ExtensionAcquisitionResult {
        const manifest = this._installed.get(id)
        if (manifest === undefined) {
            throw new Error(`Extension not installed: ${id}`)
        }
        const result = this._coordinator.acquireInstance({ manifest })
        this._events.dispatch({ type: "extensionInstanceAcquired", instance: result.instance })
        return result
    }

    releaseOwnedInstance(instance: ExtensionInstance) {
        if (this._coordinator.releaseOwnedInstance(instance)) {
            this._events.dispatch({ type: "extensionInstanceReleased", instance })
        }
    }

    uninstall(id: string) {
        const manifest = this._installed.get(id)
        if (manifest !== undefined) {
            // TODO: release instances
            this._installed.delete(id)
            this._events.dispatch({ type: "extensionUninstalled", manifest })
        }
    }
}
