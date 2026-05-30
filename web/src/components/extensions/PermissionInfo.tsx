import type { ExtensionPermissions } from "@magritte/sdk"

interface Info {
    readonly name: string
    readonly description: string
}

const info: Readonly<Record<ExtensionPermissions, Info>> = {
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

export interface PermissionInfoProps {
    readonly permission: ExtensionPermissions
    readonly compact?: boolean
}

export default function PermissionInfo({ permission, compact = false }: PermissionInfoProps) {
    const { name, description } = info[permission]
    return compact ? (
        <div className="text-xs px-2 py-1 bg-gray-100 rounded-lg" title={description}>
            {name}
        </div>
    ) : (
        <div className="flex flex-col items-start gap-0.5">
            <header className="font-medium">{name}</header>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    )
}
