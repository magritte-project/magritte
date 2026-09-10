import { CheckCircleIcon, FileIcon, FilesIcon } from "@phosphor-icons/react"
import { TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useCallback, useRef, useState } from "react"

import { useIngestFiles } from "@/api/mutations/ingest"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useDismiss from "@/hooks/dismissHook"

export interface AudioFilesUploadProps {
    readonly libraryId: number
}

export default function LibraryAudioFilesUpload({ libraryId }: AudioFilesUploadProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [files, setFiles] = useState<readonly File[]>([])
    const dismiss = useDismiss()
    const ingestFiles = useIngestFiles(libraryId)
    const handleFormSubmit = useCallback(
        (event: React.SubmitEvent<HTMLFormElement>) => {
            event.stopPropagation()
            event.preventDefault()

            const files = Array.from(inputRef.current?.files ?? [])
            if (files.length > 0 && !ingestFiles.isPending) {
                ingestFiles.mutate(files)
            }
        },
        [files, ingestFiles],
    )
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.currentTarget.files ?? [])
        setFiles((oldFiles) => [...oldFiles, ...newFiles])
    }, [])
    const handleClick = useCallback(() => inputRef.current?.showPicker(), [])
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("Files")) {
            return
        }
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }, [])
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("Files")) {
            return
        }
        e.preventDefault()
        const audioFiles = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("audio/"),
        )
        setFiles((oldFiles) => [...oldFiles, ...audioFiles])
    }, [])
    return (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 p-3">
            {ingestFiles.isIdle && (
                <>
                    <div
                        className="flex items-center justify-center"
                        onClick={handleClick}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={inputRef}
                            className="hidden"
                            type="file"
                            id="files"
                            name="files[]"
                            multiple={true}
                            accept="audio/*"
                            onChange={handleInputChange}
                        />
                        {files.length > 0 ? (
                            <ol className="w-full flex flex-col">
                                {files.map((file, index) => (
                                    <li
                                        key={`files[${file.name}@${index}`}
                                        className="flex items-center gap-3"
                                    >
                                        <FileIcon />
                                        <span className="flex-1 text-sm">{file.name}</span>
                                        <ThemedSubtleButton
                                            type="button"
                                            title="Remove"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setFiles((oldFiles) => {
                                                    const newFiles = [...oldFiles]
                                                    newFiles.splice(index, 1)
                                                    return newFiles
                                                })
                                            }}
                                        >
                                            <TrashIcon />
                                        </ThemedSubtleButton>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="flex flex-col items-center gap-3 p-3 text-center select-none cursor-default">
                                <FilesIcon size="3rem" weight="light" />
                                <span className="text-sm font-medium">Attach audio files…</span>
                            </div>
                        )}
                    </div>
                    <ThemedButton type="submit" disabled={files.length === 0}>
                        Upload
                    </ThemedButton>
                </>
            )}
            {ingestFiles.isPending && <ThemedContentUnavailable variant="inline" />}
            {ingestFiles.isError && (
                <ThemedContentUnavailable
                    variant="inline"
                    error={ingestFiles.error}
                    onRetry={ingestFiles.reset}
                    retryLabel="Start over"
                />
            )}
            {ingestFiles.isSuccess && (
                <div className="flex flex-col items-center text-center gap-3">
                    <CheckCircleIcon className="text-green-600" size="8rem" aria-label="Success" />
                    <header className="text-lg font-semibold">Upload Complete</header>
                    <main className="text-sm">
                        Magritte will process the uploaded files in the background. Successfully
                        processed files will be copied to your library and appear in the app
                        shortly.
                    </main>
                    <ThemedButton type="button" onClick={dismiss}>
                        Done
                    </ThemedButton>
                </div>
            )}
        </form>
    )
}
