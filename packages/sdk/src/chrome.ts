import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const DialogType = z4.enum(["info", "warning", "error"])
export type DialogType = z4.infer<typeof DialogType>

export const DialogButtonRole = z4.enum(["primary", "secondary", "destructive"])
export type DialogButtonRole = z4.infer<typeof DialogButtonRole>

export const DialogButton = z4.object({
    /** Unique ID for the button */
    id: z4.number(),

    /** Text label for the button */
    label: z4.string(),

    /** Role of the button (determines styling and key combos) */
    role: DialogButtonRole,
})
export type DialogButton = z4.infer<typeof DialogButton>

/** Predefined button IDs for common dialog buttons */
export const enum DialogButtonID {
    /** OK button */
    ok = 0,

    /** Cancel button */
    cancel = 1,
}

/** Default dialog buttons */
export const defaultDialogButtons: DialogButton[] = [
    { id: DialogButtonID.cancel, label: "OK", role: "primary" },
]

export const DialogOptions = z4.object({
    /** Type of dialog */
    type: DialogType,

    /** Title of the dialog */
    title: z4.string(),

    /** Message content of the dialog */
    message: z4.string().optional(),

    /** Buttons to display in the dialog */
    buttons: z4.array(DialogButton).optional(),

    /** Timeout for the dialog, in milliseconds */
    timeout: z4.number().optional(),
})
export type DialogOptions = z4.infer<typeof DialogOptions>

export const ToastOptions = z4.object({
    /** Type of toast */
    type: DialogType,

    /** Message content of the toast */
    message: z4.string(),
})
export type ToastOptions = z4.infer<typeof ToastOptions>

export const ChromeProtocol = protocol("Magritte.Host.Chrome", {
    /** Shows a dialog with the given options, returning the ID of the clicked button */
    showDialog: {
        input: DialogOptions,
        output: z4.number(),
    },

    /** Shows a toast with the given options */
    showToast: {
        input: ToastOptions,
        output: z4.void(),
    },
})

export type Chrome = ProtocolObject<typeof ChromeProtocol>
