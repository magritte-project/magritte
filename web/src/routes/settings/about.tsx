import {
    BugIcon,
    CaretRightIcon,
    CodeBlockIcon,
    ShoppingBagIcon,
    type Icon,
} from "@phosphor-icons/react"
import { createFileRoute } from "@tanstack/react-router"
import classNames from "classnames"
import type { ReactNode } from "react"

import ThemedLargeTitleSubheader from "@/components/theme/ThemedLargeTitleSubheader"

export const Route = createFileRoute("/settings/about")({
    component: function About() {
        return (
            <div className="flex flex-col gap-lg">
                <ThemedLargeTitleSubheader caption="A personal music platform – Version 0.1.0">
                    Magritte
                </ThemedLargeTitleSubheader>
                <h2 className="text-xl font-bold mt-lg pb-sm border-b border-quaternary">
                    Get Involved
                </h2>
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
                <h2 className="text-xl font-bold mt-lg pb-sm border-b border-quaternary">
                    Contributors
                </h2>
                <ol className="flex flex-col gap-lg">
                    <li className="flex items-center gap-sm">
                        <a
                            href="https://github.com/decarbonization/"
                            target="_blank"
                            className="flex items-center gap-lg underline"
                        >
                            <img
                                src="https://avatars.githubusercontent.com/u/79944?v=4"
                                referrerPolicy="no-referrer"
                                alt="Profile Icon"
                                className="w-8 aspect-square rounded-full"
                            />{" "}
                            @decarbonization
                        </a>{" "}
                        /{" "}
                        <a href="https://swampmonkeyco.com" target="_blank" className="underline">
                            Swamp Monkey Consulting
                        </a>
                    </li>
                    <li className="flex items-center gap-sm">
                        <a
                            href="https://github.com/jkantro/"
                            target="_blank"
                            className="flex items-center gap-lg underline"
                        >
                            <img
                                src="https://avatars.githubusercontent.com/u/160623?v=4"
                                referrerPolicy="no-referrer"
                                alt="Profile Icon"
                                className="w-8 aspect-square rounded-full"
                            />{" "}
                            @jkantro
                        </a>
                        /{" "}
                        <a href="https://jonkantro.com/" target="_blank" className="underline">
                            Jon Kantro Design
                        </a>
                    </li>
                </ol>
                <h2 className="text-xl font-bold mt-lg pb-sm border-b border-quaternary">
                    License
                </h2>
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
