import { useUserProfileQuery } from "@/api/hooks/users"
import type { Command } from "@/commands/command"
import useUserSession from "@/hooks/userSessionHook"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { Commands } from "./commands/Commands"

export default function UserSessionButton() {
    const { isSignedIn, signOut } = useUserSession()
    const meQuery = useUserProfileQuery(isSignedIn)
    const commands = useMemo<Command[]>(() => {
        return isSignedIn
            ? [
                  {
                      identifier: "magritte.user.signOut",
                      displayName: "Sign Out",
                  },
              ]
            : [
                  {
                      identifier: "magritte.user.signIn",
                      displayName: "Sign In",
                  },
                  {
                      identifier: "magritte.user.signUp",
                      displayName: "Sign Up",
                  },
              ]
    }, [isSignedIn])
    return (
        <Commands commands={commands}>
            {!isSignedIn ? (
                <Link to="/sign-in" className="px-2 font-bold">
                    Sign In
                </Link>
            ) : (
                <Menu>
                    <MenuButton className="px-2 font-bold">
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
            )}
        </Commands>
    )
}
