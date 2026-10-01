import { MenuButton } from "@headlessui/react"
import { CaretDownIcon, GearIcon, SignOutIcon } from "@phosphor-icons/react"
import { BooksIcon } from "@phosphor-icons/react/dist/ssr"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"

import { readUserProfile } from "@/api/queries/users"
import ThemedPopUpMenu from "@/components/theme/ThemedPopUpMenu"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useUserSession from "@/hooks/userSessionHook"

export default function UserButton() {
    const { isSignedIn, signOut } = useUserSession()
    const navigate = useNavigate()
    const api = useAPI()
    const meQuery = useQuery(readUserProfile(api, isSignedIn))
    return !isSignedIn ? (
        <Link
            to="/sign-in"
            className="px-3 py-2 font-bold rounded-button bg-secondary active:bg-secondary-active"
        >
            Sign In
        </Link>
    ) : (
        <ThemedPopUpMenu
            anchor="bottom end"
            button={
                <ThemedSubtleButton
                    buttonComponent={MenuButton}
                    className="flex items-center gap-1"
                >
                    {meQuery?.data?.preferred_name || meQuery?.data?.username || "Me"}{" "}
                    <CaretDownIcon />
                </ThemedSubtleButton>
            }
            items={[
                {
                    key: "libraries",
                    label: (
                        <>
                            <BooksIcon /> Libraries
                        </>
                    ),
                    onClick: () => {
                        navigate({ to: "/libraries" })
                    },
                },
                {
                    key: "settings",
                    label: (
                        <>
                            <GearIcon /> Settings
                        </>
                    ),
                    onClick: () => {
                        navigate({ to: "/settings" })
                    },
                },
                {
                    key: "sign-out",
                    label: (
                        <>
                            <SignOutIcon /> Sign Out
                        </>
                    ),
                    onClick: signOut,
                },
            ]}
        />
    )
}
