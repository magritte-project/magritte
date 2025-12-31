import { userProfile } from "@/api/queries/users"
import useAPIClient from "@/hooks/apiClientHook"
import useUserSession from "@/hooks/userSessionHook"
import { MenuButton } from "@headlessui/react"
import { SignOutIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import ThemedPopUpMenu from "./theme/ThemedPopUpMenu"

export default function UserSessionButton() {
    const { isSignedIn, signOut } = useUserSession()
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
                <MenuButton className="px-3 py-2 font-bold rounded-full bg-gray-50 data-open:bg-gray-100">
                    {meQuery?.data?.preferred_name ??
                        meQuery?.data?.username ??
                        "Me"}
                </MenuButton>
            }
            items={[
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
