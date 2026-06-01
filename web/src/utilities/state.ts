/**
 * Represents a subscription to changes in a property's value.
 */
export interface PropertySubscription {
    /** Unsubscribe from changes in the property's value. */
    unsubscribe(): void
}

/**
 * Utility class for managing subscribers to a property.
 */
export class PropertySubscribers<T> {
    /** The current subscribers of the property. */
    private readonly _subscribers: ((value: T) => void)[]

    /**
     * Construct a property subscribers object.
     */
    constructor() {
        this._subscribers = []
    }

    /**
     * Subscribe to changes in the property's value.
     *
     * @param subscriber A function which will be called any time
     * the subscribed-to property's value changes.
     * @returns A subscription which can be used to unsubscribe from changes.
     */
    subscribe(subscriber: (value: T) => void): PropertySubscription {
        this._subscribers.push(subscriber)
        return {
            unsubscribe: () => {
                const toRemove = this._subscribers.indexOf(subscriber)
                if (toRemove !== -1) {
                    this._subscribers.splice(toRemove, 1)
                }
            },
        }
    }

    /**
     * Notify all subscribers of a change in the property's value.
     *
     * @param value The new value of the property.
     */
    notify(value: T): void {
        for (const subscriber of this._subscribers) {
            try {
                subscriber(value)
            } catch (error) {
                console.error(`*** Unhandled error in property subscriber: ${error}`)
            }
        }
    }
}

/**
 * Represents a property which can be observed.
 */
export interface ReadonlyProperty<T> {
    /** Access the property's current value. */
    readonly wrappedValue: T

    /**
     * Subscribe to changes in the property's value.
     *
     * @param subscriber A function which will be called any time
     * the subscribed-to property's value changes.
     * @returns A subscription which can be used to unsubscribe from changes.
     */
    subscribe(subscriber: (value: T) => void): PropertySubscription
}

/**
 * Represents a property which can be observed and updated.
 */
export interface Property<T> extends ReadonlyProperty<T> {
    /** Access or assign the property's value. */
    wrappedValue: T
}

/**
 * Create a property which will not change.
 *
 * @param value The value of the property.
 * @returns An immutable property.
 */
export function $constant<T>(value: T): ReadonlyProperty<T> {
    return new Constant(value)
}

/**
 * A property which wraps a value and does not allow it to be changed.
 */
class Constant<T> implements ReadonlyProperty<T> {
    private _wrappedValue: T
    private readonly _subscribers = new PropertySubscribers<T>()

    constructor(value: T) {
        this._wrappedValue = value
    }

    get wrappedValue(): T {
        return this._wrappedValue
    }

    subscribe(subscriber: (value: T) => void): PropertySubscription {
        return this._subscribers.subscribe(subscriber)
    }

    toJson(): T {
        throw new Error("toJson is not supported on constant properties")
    }

    toString(): string {
        return `$constant(${this._wrappedValue})`
    }
}

/**
 * Create a property which can be updated and observed.
 *
 * ```typescript
 * class Player {
 *     readonly $hp = $state(100)
 *     get hp() {
 *         return this.$hp.wrappedValue
 *     }
 *     set hp(value) {
 *         this.$hp.wrappedValue = value
 *     }
 * }
 * ```
 *
 * @param initialValue The initial value of the property.
 * @returns A property which can be observed and updated.
 */
export function $state<T>(initialValue: T): Property<T> {
    return new State<T>(initialValue)
}

/**
 * A property that wraps a value and allows subscribing to changes.
 */
class State<T> implements Property<T> {
    private _wrappedValue: T
    private readonly _subscribers = new PropertySubscribers<T>()

    constructor(initialValue: T) {
        this._wrappedValue = initialValue
    }

    get wrappedValue(): T {
        return this._wrappedValue
    }

    set wrappedValue(newValue: T) {
        this._wrappedValue = newValue
        this._subscribers.notify(newValue)
    }

    subscribe(subscriber: (value: T) => void): PropertySubscription {
        return this._subscribers.subscribe(subscriber)
    }

    toJson(): T {
        throw new Error("toJson is not supported on state properties")
    }

    toString(): string {
        return `$state(${this.wrappedValue})`
    }
}

/**
 * Create a property which applies a reversible transformation to a source property's value.
 *
 * ```typescript
 * class Player {
 *     ...
 *     readonly $hpPercent = $twoWayMap(
 *         this.$hp,
 *         (hp) => hp / 100,
 *         (hp) => hp * 100
 *     )
 *     get hpPercent() {
 *         return this.$hpPercent.wrappedValue
 *     }
 *     set hpPercent(value) {
 *         this.$hpPercent.wrappedValue = value
 *     }
 * }
 * ```
 *
 * @param source The property to transform the value of.
 * @param map Transform the source value into the projected value.
 * @param unmap Transform the projected value back to the source property.
 * @returns A property which is the result of projecting the source property over the value transformation.
 */
export function $twoWayMap<T, U>(
    source: Property<T>,
    map: (value: T) => U,
    unmap: (value: U) => T,
): Property<U> {
    return new TwoWayMappedProperty<T, U>(source, map, unmap)
}

class TwoWayMappedProperty<T, U> implements Property<U> {
    private _source: Property<T>
    private _map: (value: T) => U
    private _unmap: (value: U) => T

    constructor(source: Property<T>, map: (value: T) => U, unmap: (value: U) => T) {
        this._source = source
        this._map = map
        this._unmap = unmap
    }

    get wrappedValue(): U {
        return this._map(this._source.wrappedValue)
    }

    set wrappedValue(newValue: U) {
        this._source.wrappedValue = this._unmap(newValue)
    }

    subscribe(subscriber: (value: U) => void): PropertySubscription {
        return this._source.subscribe((value) => subscriber(this._map(value)))
    }

    toJson(): U {
        throw new Error("toJson is not supported on projected state properties")
    }

    toString(): string {
        return `$twoWayMap(${this.wrappedValue})`
    }
}

/**
 * Create a property which applies a non-reversible transformation to a source property's value.
 *
 * ```typescript
 * class Player {
 *     ...
 *     readonly $isLive = $oneWayMap(this.$hp, (hp) => hp > 0)
 *     get isLive() {
 *         return this.$isLive.wrappedValue
 *     }
 * }
 * ```
 *
 * @param source The property to transform the value of.
 * @param map Transform the source value into the projected value.
 * @returns A property which is the result of projecting the source property over the value transformation.
 */
export function $oneWayMap<T, U>(source: Property<T>, map: (value: T) => U): Property<U> {
    return new OneWayMappedProperty<T, U>(source, map)
}

class OneWayMappedProperty<T, U> implements ReadonlyProperty<U> {
    private _source: Property<T>
    private _map: (value: T) => U

    constructor(source: Property<T>, map: (value: T) => U) {
        this._source = source
        this._map = map
    }

    get wrappedValue(): U {
        return this._map(this._source.wrappedValue)
    }

    subscribe(subscriber: (value: U) => void): PropertySubscription {
        return this._source.subscribe((value) => subscriber(this._map(value)))
    }

    toJson(): U {
        throw new Error("toJson is not supported on projected constant properties")
    }

    toString(): string {
        return `$oneWayMap(${this.wrappedValue})`
    }
}
