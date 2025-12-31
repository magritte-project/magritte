import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useUserSession from "@/hooks/userSessionHook"
import getServiceCommands from "@/services/commands"
import { PlusIcon, SignInIcon, SignOutIcon } from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import CommandPalette, {
    filterItems,
    getItemIndex,
    useHandleOpenCommandPalette,
} from "react-cmdk"
import "react-cmdk/dist/cmdk.css"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")
    const { isSignedIn, signOut } = useUserSession()

    const navigate = useNavigate()
    const { isOpen, setIsOpen, items: pages } = useAppCommandPaletteContext()
    const filteredItems = filterItems(
        [
            ...pages,
            // TODO: This is kind of a jank way to inject global actions...
            ...getServiceCommands(),
            {
                id: "user",
                heading: "User",
                items: isSignedIn
                    ? [
                          {
                              id: "user.signOut",
                              icon: SignOutIcon,
                              children: "Sign Out",
                              onClick: signOut,
                          },
                      ]
                    : [
                          {
                              id: "user.signIn",
                              icon: SignInIcon,
                              children: "Sign In",
                              onClick: () => navigate({ to: "/sign-in" }),
                          },
                          {
                              id: "user.signUp",
                              icon: PlusIcon,
                              children: "Sign Up",
                              onClick: () => navigate({ to: "/sign-up" }),
                          },
                      ],
            },
        ],
        search,
    )

    useHandleOpenCommandPalette(setIsOpen)

    return (
        <CommandPalette
            onChangeSearch={setSearch}
            onChangeOpen={setIsOpen}
            isOpen={isOpen}
            search={search}
            page="all"
        >
            <CommandPalette.Page id="all">
                {filteredItems.length ? (
                    filteredItems.map((list) => (
                        <CommandPalette.List
                            key={list.id}
                            heading={list.heading}
                        >
                            {list.items.map(({ id, ...rest }) => (
                                <CommandPalette.ListItem
                                    key={id}
                                    index={getItemIndex(filteredItems, id)}
                                    {...rest}
                                />
                            ))}
                        </CommandPalette.List>
                    ))
                ) : (
                    <CommandPalette.FreeSearchAction />
                )}
            </CommandPalette.Page>
        </CommandPalette>
    )
}
