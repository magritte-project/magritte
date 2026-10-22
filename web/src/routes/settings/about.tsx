import {
    BugIcon,
    CaretRightIcon,
    CodeBlockIcon,
    ShoppingBagIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import classNames from "classnames"
import type { ReactNode } from "react"

import { readInstanceStatus } from "@/api/queries/auth"
import ThemedLargeTitleSubheader from "@/components/theme/ThemedLargeTitleSubheader"
import ThemedSubsection from "@/components/theme/ThemedSubsection"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/settings/about")({
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.query(readInstanceStatus(api))
    },
    component: function About() {
        const api = useAPI()
        const { data: instanceStatus } = useSuspenseQuery(readInstanceStatus(api))
        return (
            <div className="flex flex-col gap-lg">
                <ThemedLargeTitleSubheader
                    caption={<>A personal music platform – Version {instanceStatus.version}</>}
                >
                    Magritte
                </ThemedLargeTitleSubheader>
                <ThemedSubsection>Get Involved</ThemedSubsection>
                <p>
                    Magritte is non-commercial and community driven. It’s built by and for people
                    who care about how they listen to music. Pitch in however you can to keep it
                    going.
                </p>
                <ol className="flex flex-col gap-lg text-sm">
                    <li className="bg-key-subtle p-md rounded-artwork flex flex-col gap-sm">
                        <GetInvolvedAnchor
                            icon={ShoppingBagIcon}
                            label="Sponsor"
                            blurb={
                                <>
                                    Magritte has no ads, subscriptions, or investors. Sponsorships
                                    help cover development costs.
                                </>
                            }
                            href="https://github.com/sponsors/decarbonization"
                        />
                    </li>
                    <li className="bg-key-subtle p-md rounded-artwork flex flex-col gap-sm">
                        <GetInvolvedAnchor
                            icon={BugIcon}
                            label="Report a Bug"
                            blurb={
                                <>
                                    Something not working right? Open an issue on GitHub with steps
                                    to reproduce it, and we’ll take a look.
                                </>
                            }
                            href="https://github.com/magritte-project/magritte/issues"
                        />
                    </li>
                    <li className="bg-key-subtle p-md rounded-artwork flex flex-col gap-sm">
                        <GetInvolvedAnchor
                            icon={CodeBlockIcon}
                            label="Contribute"
                            blurb={
                                <>
                                    Magritte is open source. Read the contributing guide to set up a
                                    development environment and send your first pull request.
                                </>
                            }
                            href="https://github.com/magritte-project/magritte/blob/HEAD/CONTRIBUTING.md"
                        />
                    </li>
                </ol>
                <ThemedSubsection>Contributors</ThemedSubsection>
                <ol className="flex flex-col gap-lg">
                    <li className="flex items-center gap-sm">
                        <Contributor
                            profileHref="https://github.com/decarbonization/"
                            profileImageSrc="https://avatars.githubusercontent.com/u/79944?v=4"
                            profileName="decarbonization"
                            corporationHref="https://swampmonkeyco.com"
                            corporationName="Swamp Monkey Consulting"
                        />
                    </li>
                    <li className="flex items-center gap-sm">
                        <Contributor
                            profileHref="https://github.com/jkantro/"
                            profileImageSrc="https://avatars.githubusercontent.com/u/160623?v=4"
                            profileName="jkantro"
                            corporationHref="https://jonkantro.com"
                            corporationName="Kantro Design"
                        />
                    </li>
                </ol>
                <ThemedSubsection>License</ThemedSubsection>
                <p>
                    Magritte is made available under the terms of the{" "}
                    <a
                        href="https://github.com/magritte-project/magritte/blob/HEAD/LICENSE"
                        target="_blank"
                        className="underline"
                    >
                        GNU General Public License v3
                    </a>
                    . Support packages intended to be embedded in extensions to integrate with
                    Magritte are made available under the terms of the{" "}
                    <a
                        href="https://github.com/magritte-project/magritte/blob/main/packages/sdk/LICENSE"
                        target="_blank"
                        className="underline"
                    >
                        MIT License
                    </a>
                    .
                </p>
            </div>
        )
    },
})

interface GetInvolvedAnchorProps extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "children"
> {
    readonly icon: Icon
    readonly label: ReactNode
    readonly blurb: ReactNode
}

function GetInvolvedAnchor({
    icon: Icon,
    target = "_blank",
    label,
    blurb,
    className,
    ...rest
}: GetInvolvedAnchorProps) {
    return (
        <a
            className={classNames(
                "bg-key-subtle p-md rounded-artwork flex items-center gap-sm",
                className,
            )}
            target={target}
            {...rest}
        >
            <div className="flex-1 flex flex-col gap-sm">
                <div className="flex items-center gap-sm text-base">
                    <Icon /> {label}
                </div>
                {blurb}
            </div>
            <CaretRightIcon />
        </a>
    )
}

interface ContributorProps {
    readonly profileHref: string
    readonly profileImageSrc: string
    readonly profileName: string
    readonly corporationHref: string
    readonly corporationName: string
}

function Contributor({
    profileHref,
    profileImageSrc,
    profileName,
    corporationHref,
    corporationName,
}: ContributorProps) {
    return (
        <div className="flex items-center gap-sm">
            <a href={profileHref} target="_blank" className="flex items-center gap-lg underline">
                <img
                    src={profileImageSrc}
                    referrerPolicy="no-referrer"
                    alt={`${profileName} Profile Image`}
                    className="w-8 aspect-square rounded-full"
                />{" "}
                @{profileName}
            </a>{" "}
            /{" "}
            <a href={corporationHref} target="_blank" className="underline">
                {corporationName}
            </a>
        </div>
    )
}
