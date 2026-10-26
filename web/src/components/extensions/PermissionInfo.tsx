import { getExtensionPermissionInfo } from "@/extensions/permissions"

export interface PermissionInfoProps {
    readonly permission: string
    readonly compact?: boolean
}

export default function PermissionInfo({ permission, compact = false }: PermissionInfoProps) {
    const { name, description } = getExtensionPermissionInfo(permission)
    return compact ? (
        <div className="text-xs px-md py-1 bg-secondary rounded-lg" title={description}>
            {name}
        </div>
    ) : (
        <div className="flex flex-col items-start gap-xs">
            <header className="font-medium">{name}</header>
            <p className="text-sm text-on-secondary">{description}</p>
        </div>
    )
}
