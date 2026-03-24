import { protocol } from "@magritte/rpc"
import z4 from "zod/v4"

export const HostChromeProtocol = protocol("Magritte.HostChrome", {
    showToast: {
        input: z4.object({
            message: z4.string(),
            type: z4.union([z4.literal("success"), z4.literal("error"), z4.literal("info")]),
        }),
        output: z4.void(),
    },
})
