import { ExtensionPermissionsSchema, type ExtensionPermissions } from "@magritte/api"

export interface ExtensionPermissionInfo {
    readonly name: string
    readonly description: string
}

const KNOWN_INFO: Readonly<Record<ExtensionPermissions, ExtensionPermissionInfo>> = {
    "run:background": {
        name: "Runs In Background",
        description: "The extension may run in the background, even when not in use.",
    },
    "run:eager": {
        name: "Runs At Start Up",
        description: "The extension will run when Magritte starts up.",
    },
    "commands:input:read": {
        name: "Reads On Screen Context",
        description: "The extension can read information about what's on screen in Magritte.",
    },
    "commands:input:add": {
        name: "Adds To On Screen Context",
        description: "The extension can add information about what's on screen in Magritte.",
    },
    "commands:query": {
        name: "Queries Commands",
        description: "The extension can query what commands are available.",
    },
    "commands:run": {
        name: "Runs Commands",
        description: "The extension can run commands.",
    },
    "libraries:read": {
        name: "Reads Library Data",
        description: "The extension can read any library data you have access to.",
    },
    "libraries:write": {
        name: "Writes Library Data",
        description: "The extension can write to libraries you have access to.",
    },
    "playback:read": {
        name: "Reads Playback Data",
        description: "The extension can read and monitor playback data.",
    },
    "playback:control": {
        name: "Controls Playback",
        description: "The extension can control playback.",
    },
}

export function getExtensionPermissionInfo(permission: string): ExtensionPermissionInfo {
    const result = ExtensionPermissionsSchema.safeParse(permission)
    if (result.success) {
        return KNOWN_INFO[result.data]
    } else {
        return {
            name: permission,
            description:
                "The extension has a permission which is not supported by this version of Magritte",
        }
    }
}
