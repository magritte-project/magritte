import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useCallback, useState } from "react"

import type { LibraryPermissionRead, LibraryPermissionUpdate } from "@/api/openapi"

import {
    useCreateLibraryPermission,
    useDeleteLibraryPermission,
    useUpdateLibraryPermission,
} from "@/api/mutations/libraries"
import { readLibraryPermissions } from "@/api/queries/libraries"
import { readAllUsers } from "@/api/queries/users"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedInput from "@/components/theme/ThemedInput"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPIClient from "@/hooks/apiClientHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/manage/$libraryId/permissions")({
    component: function ManageLibraryPermissions() {
        const { libraryId } = Route.useParams()
        const { showToast } = useToast()
        const apiClient = useAPIClient()
        const { data: permissions } = useSuspenseQuery(
            readLibraryPermissions(apiClient, Number(libraryId)),
        )

        const [query, setQuery] = useState("")
        const currentQuery = useDebounce(query, 100)
        const { data: allUsers } = useSuspenseQuery(readAllUsers(apiClient, currentQuery, 0, 5))

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
                    showToast({
                        message: `Failed to add user: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
            [createMutation, showToast],
        )

        return (
            <div className="p-4 flex flex-col gap-2">
                <ThemedInput
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Filter Users"
                />
                <ol>
                    {allUsers.users.map((user) => (
                        <li key={user.id} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 text-sm">{user.username}</span>
                            <ThemedSubtleButton onClick={() => handleAddUser(user.id)}>
                                <PlusIcon aria-label="Add" />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
                <h2 className="font-semibold text-lg">Existing Users</h2>
                <ol className="flex flex-col gap-2">
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
    const { showToast } = useToast()
    const updateMutation = useUpdateLibraryPermission(libraryId, data.user_id)
    const handleUpdate = useCallback(
        async (data: LibraryPermissionUpdate) => {
            try {
                await updateMutation.mutateAsync(data)
            } catch (error) {
                showToast({
                    message: `Failed to update permission: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
        [updateMutation, showToast],
    )

    const deleteMutation = useDeleteLibraryPermission(libraryId, data.user_id)
    const handleDelete = useCallback(async () => {
        const confirmed = confirm(
            `Are you sure you want to revoke ${data.username}'s access to this library?`,
        )
        if (!confirmed) {
            return
        }
        try {
            await deleteMutation.mutateAsync()
        } catch (error) {
            showToast({
                message: `Failed to update permission: ${getErrorMessage(error)}`,
                type: "error",
            })
        }
    }, [data.username, deleteMutation, showToast])

    return (
        <div className="text-sm flex items-center gap-2">
            <span className="flex-1">{data.username}</span>
            <span className="text-xs flex items-center gap-1">
                <input
                    id={`permissions[${data.user_id}].canAdd`}
                    type="checkbox"
                    checked={data.can_add}
                    onChange={(e) => {
                        handleUpdate({
                            can_add: e.currentTarget.checked,
                            can_edit: null,
                            can_remove: null,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <label htmlFor={`permissions[${data.user_id}].canAdd`}>Can Add</label>
            </span>
            <span className="text-xs flex items-center gap-1">
                <input
                    id={`permissions[${data.user_id}].canEdit`}
                    type="checkbox"
                    checked={data.can_edit}
                    onChange={(e) => {
                        handleUpdate({
                            can_add: null,
                            can_edit: e.currentTarget.checked,
                            can_remove: null,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <label htmlFor={`permissions[${data.user_id}].canEdit`}>Can Edit</label>
            </span>
            <span className="text-xs flex items-center gap-1">
                <input
                    id={`permissions[${data.user_id}].canRemove`}
                    type="checkbox"
                    checked={data.can_add}
                    onChange={(e) => {
                        handleUpdate({
                            can_add: null,
                            can_edit: null,
                            can_remove: e.currentTarget.checked,
                        })
                    }}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                />
                <label htmlFor={`permissions[${data.user_id}].canRemove`}>Can Remove</label>
            </span>
            <ThemedSubtleButton buttonComponent={AsyncButton} onClick={handleDelete}>
                <TrashIcon aria-label="Revoke Access" />
            </ThemedSubtleButton>
        </div>
    )
}
