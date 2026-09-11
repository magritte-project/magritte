import {
    CommandInputID,
    allCommandInputsOf,
    onlyCommandInputOf,
    onlyOne,
    type CommandInput,
} from "@magritte/sdk"
import z4 from "zod/v4"

import { CountedSet } from "@/utilities/countedSet"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

export type CommandInputsEvent = { readonly type: "commandInputsDidChange" }

export class CommandInputs {
    private readonly _inputs: CommandInput[]
    private readonly _kinds: CountedSet<string>
    private readonly _events: EventSink<CommandInputsEvent>

    constructor() {
        this._inputs = []
        this._kinds = new CountedSet()
        ;[this._events, this.$events] = createEvent({ label: "CommandInputs" })
    }

    readonly $events: EventStream<CommandInputsEvent>

    add(input: CommandInput): void {
        const toReplace =
            input.id === onlyOne
                ? this._inputs.findIndex(
                      (candidate) => candidate.kind === input.kind && candidate.id === onlyOne,
                  )
                : -1
        if (toReplace !== -1) {
            this._inputs[toReplace] = input
        } else {
            this._inputs.push(input)
            this._kinds.add(input.kind)
        }
        this._events({ type: "commandInputsDidChange" })
    }

    remove(kind: string, id: CommandInputID): void {
        const toRemove = this._inputs.findIndex(
            (candidate) => candidate.kind === kind && candidate.id === id,
        )
        if (toRemove !== -1) {
            this._inputs.splice(toRemove, 1)
            this._kinds.delete(kind)
            this._events({ type: "commandInputsDidChange" })
        }
    }

    hasAllOf(...kinds: readonly string[]): boolean {
        return !kinds.some((kind) => !this._kinds.has(kind))
    }

    allMatching(kinds: readonly string[]): CommandInput[] {
        return kinds.length > 0 ? this._inputs.filter((input) => kinds.includes(input.kind)) : []
    }

    allOf<TShape extends z4.ZodRawShape & { kind: z4.ZodReadonly<z4.ZodLiteral<string>> }>(
        schema: z4.ZodObject<TShape>,
    ): z4.infer<z4.ZodObject<TShape>>[] {
        return allCommandInputsOf(this._inputs, schema)
    }

    only<
        TShape extends z4.ZodRawShape & {
            kind: z4.ZodReadonly<z4.ZodLiteral<string>>
            id: z4.ZodReadonly<z4.ZodLiteral<typeof onlyOne>>
        },
    >(schema: z4.ZodObject<TShape>): z4.infer<z4.ZodObject<TShape>> {
        return onlyCommandInputOf(this._inputs, schema)
    }
}
