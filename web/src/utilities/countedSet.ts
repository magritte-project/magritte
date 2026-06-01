export class CountedSet<Item> {
    private readonly _items: Map<Item, number>

    constructor() {
        this._items = new Map<Item, number>()
    }

    get size(): number {
        return this._items.size
    }

    [Symbol.iterator](): Iterator<Item> {
        return this._items.keys()
    }

    has(item: Item): boolean {
        return this._items.has(item)
    }

    count(item: Item): number {
        return this._items.get(item) ?? 0
    }

    clear() {
        this._items.clear()
    }

    add(...newItems: readonly Item[]) {
        for (const newItem of newItems) {
            const oldCount = this._items.get(newItem) ?? 0
            this._items.set(newItem, oldCount + 1)
        }
    }

    delete(item: Item) {
        const oldCount = this._items.get(item)
        if (oldCount !== undefined) {
            if (oldCount > 1) {
                this._items.set(item, oldCount - 1)
            } else {
                this._items.delete(item)
            }
            return true
        } else {
            return false
        }
    }
}

export interface ReadonlyCountedSet<Item> {
    readonly size: number
    [Symbol.iterator](): Iterator<Item>
    has(item: Item): boolean
    count(item: Item): number
}
