import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const DialogTypeSchema = z4.enum(["info", "warning", "error"])
export type DialogType = z4.infer<typeof DialogTypeSchema>

export const DialogButtonRoleSchema = z4.enum(["primary", "secondary", "destructive"])
export type DialogButtonRole = z4.infer<typeof DialogButtonRoleSchema>

export const DialogButtonSchema = z4.object({
    /** Unique ID for the button */
    id: z4.number(),

    /** Text label for the button */
    label: z4.string(),

    /** Role of the button (determines styling and key combos) */
    role: DialogButtonRoleSchema,
})
export type DialogButton = z4.infer<typeof DialogButtonSchema>

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

export const DialogOptionsSchema = z4.object({
    /** Type of dialog */
    type: DialogTypeSchema,

    /** Title of the dialog */
    title: z4.string(),

    /** Message content of the dialog */
    message: z4.string().optional(),

    /** Buttons to display in the dialog */
    buttons: z4.array(DialogButtonSchema).optional(),

    /** Timeout for the dialog, in milliseconds */
    timeout: z4.number().optional(),
})
export type DialogOptions = z4.infer<typeof DialogOptionsSchema>

export const ToastOptionsSchema = z4.object({
    /** Type of toast */
    type: DialogTypeSchema,

    /** Message content of the toast */
    message: z4.string(),
})
export type ToastOptions = z4.infer<typeof ToastOptionsSchema>

export const NotificationCenterProtocol = protocol("Magritte.Host.NotificationCenter", {
    /** Shows a dialog with the given options, returning the ID of the clicked button */
    showDialog: {
        input: DialogOptionsSchema,
        output: z4.number(),
    },

    /** Shows a toast with the given options */
    showToast: {
        input: ToastOptionsSchema,
        output: z4.void(),
    },
})

export type NotificationCenter = ProtocolObject<typeof NotificationCenterProtocol>
