import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const UIEventsKeyPressSchema = z4.object({
    key: z4.string().max(255, { error: "key exceeds reasonable length" }),
    metaKey: z4.boolean(),
    ctrlKey: z4.boolean(),
    shiftKey: z4.boolean(),
})
export type UIEventsKeyPress = z4.infer<typeof UIEventsKeyPressSchema>

export const UIEventsProtocol = protocol("Magritte.Host.UIEventsProtocol", {
    /** Get the key presses meaningful to the host */
    getMeaningfulKeyPresses: {
        input: z4.void(),
        output: z4.array(UIEventsKeyPressSchema).readonly(),
    },
    /** Forward a key press event to the host */
    forwardKeyPress: {
        input: z4.array(UIEventsKeyPressSchema).readonly(),
        output: z4.void(),
    },
})
export type UIEvents = ProtocolObject<typeof UIEventsProtocol>
