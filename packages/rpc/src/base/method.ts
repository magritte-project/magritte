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
