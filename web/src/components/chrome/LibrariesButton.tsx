import { MenuButton } from "@headlessui/react"
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react"
import { BooksIcon } from "@phosphor-icons/react/dist/ssr"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useMemo } from "react"

import { readLibraries } from "@/api/queries/libraries"
import ThemedPopUpMenu, { type ThemedPopUpMenuItem } from "@/components/theme/ThemedPopUpMenu"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useUserSession from "@/hooks/userSessionHook"

export default function LibrariesButton() {
    const navigate = useNavigate()
    const { libraryId } = useParams({ strict: false })

    const { isSignedIn } = useUserSession()
    const api = useAPI()
    const { data: libraries = [] } = useQuery({ ...readLibraries(api), enabled: isSignedIn })

    const items = useMemo(
        () =>
            libraries.map(
                (library): ThemedPopUpMenuItem => ({
                    key: `libraries[${library.id}]`,
                    label: (
                        <div className="flex items-center gap-between w-full">
                            <div className="flex-1">{library.name}</div>
                            {String(library.id) === libraryId && (
                                <CheckIcon aria-label="Selected" />
                            )}
                        </div>
                    ),
                    onClick: () => navigate({ to: `/libraries/${library.id}` }),
                }),
            ),
        [libraries, libraryId, navigate],
    )

    return (
        <ThemedPopUpMenu
            anchor="bottom start"
            button={
                <ThemedSubtleButton
                    buttonComponent={MenuButton}
                    className="flex items-center gap-1"
                    title="Libraries"
                >
                    <BooksIcon size="2em" weight="light" />
                    <CaretDownIcon />
                </ThemedSubtleButton>
            }
            items={[
                ...items,
                {
                    key: "libraries.all",
                    label: "All",
                    onClick: () => navigate({ to: "/libraries" }),
                },
            ]}
        />
    )
}
