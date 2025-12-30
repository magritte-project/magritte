import { SignInIcon, SignOutIcon } from "@phosphor-icons/react";
import type { JsonStructure } from "react-cmdk";

export function getCommandsForAppleMusic(): JsonStructure {
    return [
        {
            id: "applemusic",
            heading: "Apple Music",
            items: MusicKit.getInstance().isAuthorized ? [
                {
                    id: "applemusic.unauthorize",
                    icon: SignOutIcon,
                    children: "Unauthorize",
                    onClick: () => {
                        MusicKit.getInstance().unauthorize()
                    },
                },
            ] : [
                {
                    id: "applemusic.authorize",
                    icon: SignInIcon,
                    children: "Authorize",
                    onClick: () => {
                        MusicKit.getInstance().authorize()
                    },
                },
            ],
        },
    ]
}