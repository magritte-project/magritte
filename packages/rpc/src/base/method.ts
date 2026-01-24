import * as z4 from "zod/v4/core"

export interface RPCMethod<
    Selector extends string,
    Parameters extends z4.$ZodType,
    Result extends z4.$ZodType,
> {
    readonly selector: Selector
    readonly parameters: Parameters
    readonly result: Result
}

/** Creates a new method for a protocol. */
export function method<
    const Selector extends string,
    const Parameters extends z4.$ZodType,
    const Result extends z4.$ZodType,
>(
    selector: Selector,
    parameters: Parameters,
    result: Result,
): RPCMethod<Selector, Parameters, Result> {
    return {
        selector,
        parameters,
        result,
    }
}

export type RPCMethodImplementation<Method extends _AnyRPCMethod> = (
    parameters: z4.infer<_RPCMethodParameters<Method>>,
) => Promise<z4.infer<_RPCMethodResult<Method>>>

/** @private */
export type _AnyRPCMethod = RPCMethod<string, z4.$ZodType, z4.$ZodType>

/** @private */
export type _RPCMethodSelector<Method> =
    Method extends RPCMethod<infer Selector, any, any> ? Selector : never

/** @private */
export type _RPCMethodParameters<Method> =
    Method extends RPCMethod<any, infer Parameters, any> ? Parameters : never

/** @private */
export type _RPCMethodResult<Method> =
    Method extends RPCMethod<any, any, infer Result> ? Result : never
