import { ExtensionInstance, type ExtensionInstanceOptions } from "./instance"

export interface ExtensionAcquisitionResult {
    /** The newly acquired extension instance */
    readonly instance: ExtensionInstance

    /** Whether the caller is the owner of the instance, i.e. it was newly created */
    readonly isOwner: boolean
}

export class ExtensionCoordinator {
    /** Tracks any extension instances that have been acquired */
    private readonly _instances: ExtensionInstance[]

    constructor() {
        this._instances = []
    }

    acquireInstance(options: ExtensionInstanceOptions): ExtensionAcquisitionResult {
        if (!options.manifest.allowsMultipleInstances) {
            const instance = this._instances.find(
                (instance) => instance.manifest.id === options.manifest.id,
            )
            if (instance) {
                return { instance, isOwner: false }
            }
        }

        const instance = new ExtensionInstance(options)
        this._instances.push(instance)
        return { instance, isOwner: true }
    }

    releaseOwnedInstance(instance: ExtensionInstance): boolean {
        const toRemove = this._instances.indexOf(instance)
        if (toRemove !== -1) {
            const [instance] = this._instances.splice(toRemove, 1)
            instance.unload()
            return true
        } else {
            return false
        }
    }
}
