import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import type { SongRead, SongUpdate } from "@/api/openapi"
import type { SplitComponentProps } from "@/splits/base"

import { useUpdateLibrarySong } from "@/api/mutations/libraries"
import { readLibrarySong } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"

export type SongEditorProps = SplitComponentProps

export default function SongEditor({ parameters }: SongEditorProps) {
    const apiClient = useAPIClient()
    const [libraryId, songId] = useMemo(() => {
        const numberParameters = parameters.filter((parameter) => typeof parameter === "number")
        if (numberParameters.length === 2) {
            return numberParameters
        } else {
            return [null, null]
        }
    }, [parameters])

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
    const updateMutation = useUpdateLibrarySong(libraryId, song.id)
    const form = useAppForm({
        defaultValues: song,
        onSubmit: async ({ value }) => {
            await updateMutation.mutateAsync(value as unknown as SongUpdate)
        },
    })
    return (
        <AppForm form={form} className="p-2 flex flex-col gap-2">
            <form.AppField name="title">
                {(field) => (
                    <section>
                        <label htmlFor="title" className="font-bold text-sm pb-1">
                            Title
                        </label>
                        <field.InputField placeholder="Title" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="album_artist">
                {(field) => (
                    <section>
                        <label htmlFor="album_artist" className="font-bold text-sm pb-1">
                            Album Artist
                        </label>
                        <field.InputField placeholder="Album Artist" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="composer">
                {(field) => (
                    <section>
                        <label htmlFor="composer" className="font-bold text-sm pb-1">
                            Composer
                        </label>
                        <field.InputField placeholder="Composer" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="genre">
                {(field) => (
                    <section>
                        <label htmlFor="genre" className="font-bold text-sm pb-1">
                            Genre
                        </label>
                        <field.InputField placeholder="Genre" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="release_date">
                {(field) => (
                    <section>
                        <label htmlFor="release_date" className="font-bold text-sm pb-1">
                            Release Date
                        </label>
                        <field.InputField placeholder="Release Date" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="track_number">
                {(field) => (
                    <section>
                        <label htmlFor="track_number" className="font-bold text-sm pb-1">
                            Track Number
                        </label>
                        <field.InputField type="number" placeholder="Track Number" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="track_total">
                {(field) => (
                    <section>
                        <label htmlFor="track_total" className="font-bold text-sm pb-1">
                            Track Total
                        </label>
                        <field.InputField type="number" placeholder="Track Total" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="disc_number">
                {(field) => (
                    <section>
                        <label htmlFor="disc_number" className="font-bold text-sm pb-1">
                            Disc Number
                        </label>
                        <field.InputField type="number" placeholder="Disc Number" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="disc_total">
                {(field) => (
                    <section>
                        <label htmlFor="disc_total" className="font-bold text-sm pb-1">
                            Disc Total
                        </label>
                        <field.InputField type="number" placeholder="Disc Total" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="lyrics">
                {(field) => (
                    <section>
                        <label htmlFor="lyrics" className="font-bold text-sm pb-1">
                            Lyrics
                        </label>
                        <field.InputField placeholder="Lyrics" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="rating">
                {(field) => (
                    <section>
                        <label htmlFor="rating" className="font-bold text-sm pb-1">
                            Rating
                        </label>
                        <field.InputField placeholder="Rating" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="bpm">
                {(field) => (
                    <section>
                        <label htmlFor="bpm" className="font-bold text-sm pb-1">
                            BPM
                        </label>
                        <field.InputField type="number" placeholder="BPM" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="comment">
                {(field) => (
                    <section>
                        <label htmlFor="comment" className="font-bold text-sm pb-1">
                            Comment
                        </label>
                        <field.InputField placeholder="Comment" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="grouping">
                {(field) => (
                    <section>
                        <label htmlFor="grouping" className="font-bold text-sm pb-1">
                            Grouping
                        </label>
                        <field.InputField placeholder="Grouping" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="mcn">
                {(field) => (
                    <section>
                        <label htmlFor="mcn" className="font-bold text-sm pb-1">
                            MCN
                        </label>
                        <field.InputField placeholder="MCN" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="isrc">
                {(field) => (
                    <section>
                        <label htmlFor="isrc" className="font-bold text-sm pb-1">
                            ISRC
                        </label>
                        <field.InputField placeholder="ISRC" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="music_brainz_release_id">
                {(field) => (
                    <section>
                        <label htmlFor="music_brainz_release_id" className="font-bold text-sm pb-1">
                            Music Brainz Release ID
                        </label>
                        <field.InputField placeholder="Music Brainz Release ID" />
                    </section>
                )}
            </form.AppField>
            <form.AppField name="music_brainz_recording_id">
                {(field) => (
                    <section>
                        <label
                            htmlFor="music_brainz_recording_id"
                            className="font-bold text-sm pb-1"
                        >
                            Music Brainz Recording ID
                        </label>
                        <field.InputField placeholder="Music Brainz Recording ID" />
                    </section>
                )}
            </form.AppField>
            <form.SubmitButton>Save</form.SubmitButton>
        </AppForm>
    )
}
