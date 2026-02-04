/**
 * A stack-like data structure which tracks the number of times unique item IDs occur.
 */
export class CountingStack<Item extends {}, ItemIDKey extends keyof Item> {
    /** Key used to identify items in the stack */
    private readonly _idKey: ItemIDKey

    /** The number of times each item ID occurs in the stack */
    private readonly _uniqueItemCounts: Map<Item[ItemIDKey], number>

    /** The items in the stack */
    private readonly _items: Item[]

    constructor(idKey: ItemIDKey) {
        this._idKey = idKey
        this._uniqueItemCounts = new Map<Item[ItemIDKey], number>()
        this._items = []
    }

    /** Increment the number of times an item ID occurs in the stack */
    private _incrementCountOf(item: Item) {
        const itemID = item[this._idKey]
        const oldCount = this._uniqueItemCounts.get(itemID) ?? 0
        this._uniqueItemCounts.set(itemID, oldCount + 1)
    }

    /** Decrement the number of times an item ID occurs in the stack */
    private _decrementCountOf(item: Item) {
        const itemID = item[this._idKey]
        const oldCount = this._uniqueItemCounts.get(itemID)
        if (oldCount !== undefined) {
            if (oldCount > 1) {
                this._uniqueItemCounts.set(itemID, oldCount - 1)
            } else {
                this._uniqueItemCounts.delete(itemID)
            }
        }
    }

    get size(): number {
        return this._items.length
    }

    get items(): readonly Item[] {
        return this._items
    }

    has(itemID: Item[ItemIDKey]): boolean {
        return this._uniqueItemCounts.has(itemID)
    }

    count(itemID: Item[ItemIDKey]): number {
        return this._uniqueItemCounts.get(itemID) ?? 0
    }

    clear() {
        this._uniqueItemCounts.clear()
        this._items.length = 0
    }

    push(...newItems: readonly Item[]) {
        for (const newItem of newItems) {
            this._incrementCountOf(newItem)
            this._items.push(newItem)
        }
    }

    pop(): Item | undefined {
        const item = this._items.pop()
        if (item !== undefined) {
            this._decrementCountOf(item)
        }
        return item
    }
}

export interface ReadonlyCountingStack<Item extends {}, ItemIDKey extends keyof Item> {
    readonly size: number
    readonly items: readonly Item[]
    has(itemID: Item[ItemIDKey]): boolean
    count(itemID: Item[ItemIDKey]): number
}
