import {
    singletonCommandInputId,
    type CommandInput,
    type SingletonCommandInput,
} from "@magritte/sdk/host"
import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"
import z4 from "zod/v4"

export type CommandInputsEvent = { readonly type: "commandInputsDidChange" }

export class CommandInputs {
    private readonly _inputs: Map<string, Map<string | number, unknown>>
    private readonly _events: EventSink<CommandInputsEvent>

    constructor() {
        this._inputs = new Map()
        ;[this._events, this.$events] = createEvent<CommandInputsEvent>()
    }

    readonly $events: EventStream<CommandInputsEvent>

    add(input: CommandInput): void {
        let inputsOfKind = this._inputs.get(input.kind)
        if (inputsOfKind === undefined) {
            inputsOfKind = new Map<string | number, unknown>()
            this._inputs.set(input.kind, inputsOfKind)
        }

        if (input.id !== singletonCommandInputId && inputsOfKind.get(input.id) !== undefined) {
            throw new Error(`Input with id ${input.id} already exists for kind ${input.kind}`)
        }
        inputsOfKind.set(input.id, input)
        this._events.dispatch({ type: "commandInputsDidChange" })
    }

    remove(input: CommandInput): void {
        const inputsOfKind = this._inputs.get(input.kind)
        if (inputsOfKind !== undefined) {
            const deleted = inputsOfKind.delete(input.id)
            if (deleted) {
                this._events.dispatch({ type: "commandInputsDidChange" })
            }
        }
    }

    hasAny<K extends string, T extends CommandInput & { kind: K }>(
        kind: K,
        schema: z4.ZodType<T>,
    ): boolean {
        const inputsOfKind = this._inputs.get(kind)
        if (inputsOfKind === undefined) {
            return false
        }
        for (const input of inputsOfKind.values()) {
            if (schema.safeParse(input).success) {
                return true
            }
        }
        return false
    }

    allOf<K extends string, T extends CommandInput & { kind: K }>(
        kind: K,
        schema: z4.ZodType<T>,
    ): T[] {
        const inputsOfKind = this._inputs.get(kind)
        if (inputsOfKind === undefined) {
            return []
        }
        return Array.from(inputsOfKind.values(), (input) => schema.parse(input))
    }

    only<K extends string, T extends SingletonCommandInput & { kind: K }>(
        kind: K,
        schema: z4.ZodType<T>,
    ): T {
        const inputsOfKind = this._inputs.get(kind)
        if (inputsOfKind === undefined || inputsOfKind.size !== 1) {
            throw new Error(
                `Expected exactly one input of kind ${kind}, but got ${inputsOfKind?.size ?? 0}`,
            )
        }
        const [input] = inputsOfKind.values()
        return schema.parse(input)
    }
}
