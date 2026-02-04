import {
    ArrowsLeftRightIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
    RepeatOnceIcon,
    SignInIcon,
    SignOutIcon,
    SkipBackIcon,
    SkipForwardIcon,
    RepeatIcon,
    ShuffleIcon,
} from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import CommandPalette, { filterItems, getItemIndex, useHandleOpenCommandPalette } from "react-cmdk"

import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import usePlayer from "@/hooks/playerHook"
import useServiceRegistry from "@/hooks/serviceRegistryHook"

import "react-cmdk/dist/cmdk.css"
import useUserSession from "@/hooks/userSessionHook"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")
    const { isSignedIn, signOut } = useUserSession()
    const serviceRegistry = useServiceRegistry()
    const player = usePlayer()

    const navigate = useNavigate()
    const { isOpen, setIsOpen, items: pages } = useAppCommandPaletteContext()
    const filteredItems = filterItems(
        [
            ...pages,
            // TODO: This is kind of a jank way to inject global actions...
            ...serviceRegistry.commands,
            {
                id: "playback",
                heading: "Playback",
                items: [
                    {
                        id: "playback.skipPrevious",
                        icon: SkipBackIcon,
                        children: "Skip Previous",
                        onClick: () => player.skipPrevious(),
                        disabled: player.playbackState === "stopped",
                    },
                    {
                        id: "playback.playPaused",
                        icon: player.playbackState === "playing" ? PauseIcon : PlayIcon,
                        children: player.playbackState === "playing" ? "Pause" : "Play",
                        onClick: () => player.skipPrevious(),
                        disabled: player.playbackState === "stopped",
                    },
                    {
                        id: "playback.skipNext",
                        icon: SkipForwardIcon,
                        children: "Skip Next",
                        onClick: () => player.skipNext(),
                        disabled: player.playbackState === "stopped",
                    },
                    {
                        id: "playback.repeatOff",
                        icon: RepeatIcon,
                        children: "Repeat Off",
                        onClick: () =>
                            player.setPlaybackModes((playbackModes) =>
                                playbackModes.withRepeat("off"),
                            ),
                        disabled: player.playbackModes.repeat === "off",
                    },
                    {
                        id: "playback.repeatAll",
                        icon: RepeatIcon,
                        children: "Repeat All",
                        onClick: () =>
                            player.setPlaybackModes((playbackModes) =>
                                playbackModes.withRepeat("all"),
                            ),
                        disabled: player.playbackModes.repeat === "all",
                    },
                    {
                        id: "playback.repeatOne",
                        icon: RepeatOnceIcon,
                        children: "Repeat One",
                        onClick: () =>
                            player.setPlaybackModes((playbackModes) =>
                                playbackModes.withRepeat("one"),
                            ),
                        disabled: player.playbackModes.repeat === "one",
                    },
                    {
                        id: "playback.shuffleOff",
                        icon: ArrowsLeftRightIcon,
                        children: "Shuffle Off",
                        onClick: () =>
                            player.setPlaybackModes((playbackModes) =>
                                playbackModes.withShuffle("off"),
                            ),
                        disabled: player.playbackModes.shuffle === "off",
                    },
                    {
                        id: "playback.shuffleOn",
                        icon: ShuffleIcon,
                        children: "Shuffle On",
                        onClick: () =>
                            player.setPlaybackModes((playbackModes) =>
                                playbackModes.withShuffle("on"),
                            ),
                        disabled: player.playbackModes.shuffle === "on",
                    },
                ],
            },
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
                        <CommandPalette.List key={list.id} heading={list.heading}>
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
