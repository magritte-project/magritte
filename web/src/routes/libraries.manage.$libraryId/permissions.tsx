import { Field, Label } from "@headlessui/react"
import type { LibraryPermissionRead, LibraryPermissionUpdate } from "@magritte/api"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useCallback, useState } from "react"

import {
    useCreateLibraryPermission,
    useDeleteLibraryPermission,
    useUpdateLibraryPermission,
} from "@/api/mutations/libraries"
import { readLibraryPermissions } from "@/api/queries/libraries"
import { readAllUsers } from "@/api/queries/users"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedInput from "@/components/theme/ThemedInput"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/manage/$libraryId/permissions")({
    component: function ManageLibraryPermissions() {
        const { libraryId } = Route.useParams()
        const notificationCenter = useNotificationCenter()
        const api = useAPI()
        const { data: permissions } = useSuspenseQuery(
            readLibraryPermissions(api, Number(libraryId)),
        )

        const [query, setQuery] = useState("")
        const currentQuery = useDebounce(query, 100)
        const { data: allUsers } = useSuspenseQuery(readAllUsers(api, currentQuery, 0, 5))

        const createMutation = useCreateLibraryPermission(Number(libraryId))
        const handleAddUser = useCallback(
            async (userId: number) => {
                try {
                    await createMutation.mutateAsync({
                        user_id: userId,
                        can_add: false,
                        can_edit: false,
                        can_remove: false,
                    })
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Failed to add user: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
            [notificationCenter, createMutation],
        )

        return (
            <div className="p-xl flex flex-col gap-md">
                <ThemedInput
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Filter Users"
                />
                <ol>
                    {allUsers.users.map((user) => (
                        <li key={user.id} className="flex items-center gap-md text-sm">
                            <span className="flex-1 text-sm">{user.username}</span>
                            <ThemedSubtleButton title="Add" onClick={() => handleAddUser(user.id)}>
                                <PlusIcon />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
                <h2 className="font-semibold text-lg">Existing Users</h2>
                <ol className="flex flex-col gap-md">
                    {permissions.map((permission) => (
                        <li key={permission.user_id}>
                            <UserPermissionItem libraryId={Number(libraryId)} data={permission} />
                        </li>
                    ))}
                </ol>
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable className="h-auto!" />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable className="h-auto!" error={error} onRetry={reset} />
    },
})

interface UserPermissionItemProps {
    readonly libraryId: number
    readonly data: LibraryPermissionRead
}

function UserPermissionItem({ libraryId, data }: UserPermissionItemProps) {
    const notificationCenter = useNotificationCenter()
    const updateMutation = useUpdateLibraryPermission(libraryId, data.user_id)
    const handleUpdate = useCallback(
        async (data: LibraryPermissionUpdate) => {
            try {
                await updateMutation.mutateAsync(data)
            } catch (error) {
                notificationCenter.showToast({
                    message: `Failed to update permission: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
        [notificationCenter, updateMutation],
    )

    const deleteMutation = useDeleteLibraryPermission(libraryId, data.user_id)
    const handleDelete = useCallback(async () => {
        const confirmed = await notificationCenter.confirm({
            title: `Are you sure you want to revoke ${data.username}'s access to this library?`,
            message: "You can re-add this user later.",
            destructive: true,
            confirmButtonLabel: "Revoke Access",
        })
        if (!confirmed) {
            return
        }
        try {
            await deleteMutation.mutateAsync()
        } catch (error) {
            notificationCenter.showToast({
                message: `Failed to update permission: ${getErrorMessage(error)}`,
                type: "error",
            })
        }
    }, [notificationCenter, data.username, deleteMutation])

    return (
        <div className="text-sm flex items-center gap-md">
            <span className="flex-1">{data.username}</span>
            <Field className="text-xs font-semibold flex items-center gap-sm">
                <ThemedCheckbox
                    id={`permissions[${data.user_id}].canAdd`}
                    checked={data.can_add}
                    onChange={(checked) => {
                        void handleUpdate({
                            can_add: checked,
                            can_edit: null,
                            can_remove: null,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <Label htmlFor={`permissions[${data.user_id}].canAdd`}>Can Add</Label>
            </Field>
            <Field className="text-xs flex items-center gap-sm">
                <ThemedCheckbox
                    id={`permissions[${data.user_id}].canEdit`}
                    checked={data.can_edit}
                    onChange={(checked) => {
                        void handleUpdate({
                            can_add: null,
                            can_edit: checked,
                            can_remove: null,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <Label htmlFor={`permissions[${data.user_id}].canEdit`}>Can Edit</Label>
            </Field>
            <Field className="text-xs flex items-center gap-sm">
                <ThemedCheckbox
                    id={`permissions[${data.user_id}].canRemove`}
                    checked={data.can_remove}
                    onChange={(checked) => {
                        void handleUpdate({
                            can_add: null,
                            can_edit: null,
                            can_remove: checked,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <Label htmlFor={`permissions[${data.user_id}].canRemove`}>Can Remove</Label>
            </Field>
            <ThemedButton
                buttonComponent={AsyncButton}
                destructive
                title="Revoke Access"
                onClick={handleDelete}
            >
                <TrashIcon />
            </ThemedButton>
        </div>
    )
}
