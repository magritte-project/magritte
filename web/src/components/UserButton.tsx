import { MenuButton } from "@headlessui/react"
import { CaretDownIcon, CrownIcon, SignOutIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"

import { userProfile } from "@/api/queries/users"
import ThemedPopUpMenu from "@/components/theme/ThemedPopUpMenu"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPIClient from "@/hooks/apiClientHook"
import useUserSession from "@/hooks/userSessionHook"

export default function UserButton() {
    const { isSignedIn, signOut } = useUserSession()
    const navigate = useNavigate()
    const apiClient = useAPIClient()
    const meQuery = useQuery(userProfile(apiClient, isSignedIn))
    return !isSignedIn ? (
        <Link
            to="/sign-in"
            className="px-3 py-2 font-bold rounded-full bg-gray-50 active:bg-gray-100"
        >
            Sign In
        </Link>
    ) : (
        <ThemedPopUpMenu
            button={
                <ThemedSubtleButton
                    buttonComponent={MenuButton}
                    className="flex items-center gap-1"
                >
                    {meQuery?.data?.preferred_name ?? meQuery?.data?.username ?? "Me"}{" "}
                    <CaretDownIcon />
                </ThemedSubtleButton>
            }
            items={[
                {
                    key: "admin",
                    requiresScopes: ["admin"],
                    label: (
                        <>
                            <CrownIcon /> Admin
                        </>
                    ),
                    onClick: () => {
                        navigate({ to: "/admin" })
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
