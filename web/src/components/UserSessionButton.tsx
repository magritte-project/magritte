import { useUserProfileQuery } from "@/api/hooks/users"
import useUserSession from "@/hooks/userSessionHook"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { Link } from "@tanstack/react-router"

export default function UserSessionButton() {
    const { isSignedIn, signOut } = useUserSession()
    const meQuery = useUserProfileQuery(isSignedIn)
    return !isSignedIn ? (
        <Link
            to="/sign-in"
            className="px-3 py-2 font-bold rounded-full bg-gray-50 data-open:bg-gray-100"
        >
            Sign In
        </Link>
    ) : (
        <Menu>
            <MenuButton className="px-3 py-2 font-bold rounded-full bg-gray-50 data-open:bg-gray-100">
                {meQuery?.data?.preferred_name ??
                    meQuery?.data?.username ??
                    "Me"}
            </MenuButton>
            <MenuItems
                anchor="bottom end"
                className="bg-white border border-slate-100 shadow rounded-sm"
            >
                <MenuItem>
                    <button
                        type="button"
                        className="block p-2 data-focus:bg-blue-100 text-nowrap"
                        onClick={signOut}
                    >
                        Sign Out
                    </button>
                </MenuItem>
            </MenuItems>
        </Menu>
    )
}
