import type { SongRead, SongUpdate } from "@magritte/api"
import { LibraryInput, LibrarySongInput } from "@magritte/sdk"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import z from "zod"

import { useUpdateLibrarySong } from "@/api/mutations/libraries"
import { readLibrarySong } from "@/api/queries/libraries"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPIClient from "@/hooks/apiClientHook"
import useCommandInputs from "@/hooks/commandInputsHook"
import { useAppForm } from "@/hooks/formHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export default function SongEditor() {
    const apiClient = useAPIClient()
    const commandInputs = useCommandInputs()
    const [libraryId, songId] = useMemo(() => {
        const libraryInputs = commandInputs.allOf(LibraryInput)
        if (libraryInputs.length === 0) {
            return [null, null]
        }
        const songInputs = commandInputs.allOf(LibrarySongInput)
        if (songInputs.length === 0) {
            return [null, null]
        }
        return [libraryInputs[0].id, songInputs[0].id]
    }, [commandInputs])

    const songQuery = useQuery({
        ...readLibrarySong(apiClient, libraryId ?? 0, songId ?? 0),
        enabled: libraryId !== null && songId !== null,
    })

    if (libraryId === null || songId === null || songQuery.isPending) {
        return <ThemedContentUnavailable />
    }
    if (songQuery.isError) {
        return <ThemedContentUnavailable error={songQuery.error} onRetry={songQuery.refetch} />
    }

    return <SongForm libraryId={libraryId} song={songQuery.data} />
}

interface SongFormProps {
    readonly libraryId: number
    readonly song: SongRead
}

function SongForm({ libraryId, song }: SongFormProps) {
    const { showToast } = useToast()
    const updateMutation = useUpdateLibrarySong(libraryId, song.id)
    const form = useAppForm({
        defaultValues: song,
        onSubmit: async ({ value, formApi }) => {
            try {
                await updateMutation.mutateAsync(value as unknown as SongUpdate)
                formApi.reset()
            } catch (error) {
                showToast({
                    message: `Could not update song: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        },
    })
    return (
        <AppForm form={form} className="p-2 flex flex-col gap-2">
            <form.AppField name="title">
                {(field) => (
                    <FieldDecoration field={field} label="Title">
                        <field.InputField placeholder="Title" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="album_artist">
                {(field) => (
                    <FieldDecoration field={field} label="Album Artist">
                        <field.InputField placeholder="Album Artist" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="composer">
                {(field) => (
                    <FieldDecoration field={field} label="Composer">
                        <field.InputField placeholder="Composer" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="genre">
                {(field) => (
                    <FieldDecoration field={field} label="Genre">
                        <field.InputField placeholder="Genre" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="release_date">
                {(field) => (
                    <FieldDecoration field={field} label="Release Date">
                        <field.InputField placeholder="Release Date" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <div className="flex items-center justify-evenly gap-2">
                <form.AppField
                    name="track_number"
                    validators={{ onChange: z.number().gt(0).nullish() }}
                >
                    {(field) => (
                        <FieldDecoration field={field} label="Track Number">
                            <field.InputField
                                className="w-full"
                                type="number"
                                placeholder="Track Number"
                            />
                        </FieldDecoration>
                    )}
                </form.AppField>
                <form.AppField
                    name="track_total"
                    validators={{ onChange: z.number().gt(0).nullish() }}
                >
                    {(field) => (
                        <FieldDecoration field={field} label="Track Total">
                            <field.InputField
                                className="w-full"
                                type="number"
                                placeholder="Track Total"
                            />
                        </FieldDecoration>
                    )}
                </form.AppField>
            </div>
            <div className="flex items-center justify-evenly gap-2">
                <form.AppField
                    name="disc_number"
                    validators={{ onChange: z.number().gt(0).nullish() }}
                >
                    {(field) => (
                        <FieldDecoration field={field} label="Disc Number">
                            <field.InputField
                                className="w-full"
                                type="number"
                                placeholder="Disc Number"
                            />
                        </FieldDecoration>
                    )}
                </form.AppField>
                <form.AppField
                    name="disc_total"
                    validators={{ onChange: z.number().gt(0).nullish() }}
                >
                    {(field) => (
                        <FieldDecoration field={field} label="Disc Total">
                            <field.InputField
                                className="w-full"
                                type="number"
                                placeholder="Disc Total"
                            />
                        </FieldDecoration>
                    )}
                </form.AppField>
            </div>
            <form.AppField name="lyrics">
                {(field) => (
                    <FieldDecoration field={field} label="Lyrics">
                        <field.TextareaField placeholder="Lyrics" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField
                name="rating"
                validators={{ onChange: z.number().gte(0).lte(5).nullish() }}
            >
                {(field) => (
                    <FieldDecoration field={field} label="Rating">
                        <field.InputField placeholder="Rating" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="bpm" validators={{ onChange: z.number().gt(0).nullish() }}>
                {(field) => (
                    <FieldDecoration field={field} label="BPM">
                        <field.InputField type="number" placeholder="BPM" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="comment">
                {(field) => (
                    <FieldDecoration field={field} label="Comment">
                        <field.TextareaField placeholder="Comment" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="grouping">
                {(field) => (
                    <FieldDecoration field={field} label="Grouping">
                        <field.InputField placeholder="Grouping" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="mcn">
                {(field) => (
                    <FieldDecoration field={field} label="MCN">
                        <field.InputField placeholder="MCN" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="isrc">
                {(field) => (
                    <FieldDecoration field={field} label="ISRC">
                        <field.InputField placeholder="ISRC" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="music_brainz_release_id">
                {(field) => (
                    <FieldDecoration field={field} label="Music Brainz Release ID">
                        <field.InputField placeholder="Music Brainz Release ID" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.AppField name="music_brainz_recording_id">
                {(field) => (
                    <FieldDecoration field={field} label="Music Brainz Recording ID">
                        <field.InputField placeholder="Music Brainz Recording ID" />
                    </FieldDecoration>
                )}
            </form.AppField>
            <form.SubmitButton>Save</form.SubmitButton>
        </AppForm>
    )
}
