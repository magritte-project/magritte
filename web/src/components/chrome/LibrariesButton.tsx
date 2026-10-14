import { MenuButton } from "@headlessui/react"
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react"
import { BooksIcon } from "@phosphor-icons/react/dist/ssr"
import { useQuery } from "@tanstack/react-query"
import { useMatchRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useCallback, useMemo, type ReactNode } from "react"

import { readLibraries } from "@/api/queries/libraries"
import ThemedPopUpMenu, { type ThemedPopUpMenuItem } from "@/components/theme/ThemedPopUpMenu"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useUserSession from "@/hooks/userSessionHook"

export default function LibrariesButton() {
    const navigate = useNavigate()
    const { libraryId } = useParams({ strict: false })
    const matchRoute = useMatchRoute()

    const { isSignedIn } = useUserSession()
    const api = useAPI()
    const { data: libraries = [] } = useQuery({ ...readLibraries(api), enabled: isSignedIn })

    const items = useMemo(
        () =>
            libraries.map((library): ThemedPopUpMenuItem => ({
                key: `libraries[${library.id}]`,
                label: (
                    <LibraryLabel name={library.name} selected={String(library.id) === libraryId} />
                ),
                onClick: () => navigate({ to: `/libraries/${library.id}` }),
            })),
        [libraries, libraryId, navigate],
    )
    const selectedLibrary = useMemo(
        () => libraries.find((library) => String(library.id) === libraryId),
        [libraries, libraryId],
    )

    const navigateToManage = useCallback(() => {
        if (libraryId === undefined) {
            return
        }
        navigate({ to: `/libraries/manage/$libraryId`, params: { libraryId } })
    }, [navigate, libraryId])
    const navigateToAll = useCallback(() => navigate({ to: "/libraries" }), [navigate])
    const navigateToAdd = useCallback(() => navigate({ to: "/libraries/add" }), [navigate])

    return (
        <ThemedPopUpMenu
            anchor="bottom start"
            button={
                <ThemedSubtleButton
                    buttonComponent={MenuButton}
                    className="flex items-center gap-sm"
                    title="Libraries"
                >
                    <BooksIcon size="2em" weight="light" />
                    <span className="text-nowrap">{selectedLibrary?.name ?? "All"}</span>
                    <CaretDownIcon />
                </ThemedSubtleButton>
            }
            items={[
                {
                    key: "libraries.all",
                    label: (
                        <LibraryLabel
                            name="All"
                            selected={libraryId === undefined && !!matchRoute({ to: "/libraries" })}
                        />
                    ),
                    onClick: navigateToAll,
                },
                { isSeparator: true },
                ...items,
                { isSeparator: true },
                {
                    key: "libraries.manage",
                    label: <>Manage {selectedLibrary?.name}</>,
                    disabled: libraryId === undefined,
                    onClick: navigateToManage,
                },
                {
                    key: "libraries.add",
                    label: "New Library",
                    onClick: navigateToAdd,
                },
            ]}
        />
    )
}

interface LibraryLabelProps {
    readonly name: ReactNode
    readonly selected: boolean
}

function LibraryLabel({ name, selected }: LibraryLabelProps) {
    return (
        <div className="flex items-center gap-lg w-full">
            <div className="flex-1">{name}</div>
            {selected && <CheckIcon aria-label="Selected" />}
        </div>
    )
}
