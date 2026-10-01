import classNames from "classnames"
import { useEffect, useState } from "react"

export interface ExtensionIconProps {
    readonly iconUrl?: string | null
    readonly name: string
    readonly size?: string
}

export default function ExtensionIcon({ iconUrl, name, size = "2rem" }: ExtensionIconProps) {
    const [imageLoadFailed, setImageLoadFailed] = useState(false)
    useEffect(() => {
        return () => {
            setImageLoadFailed(false)
        }
    }, [])

    if (iconUrl && !imageLoadFailed) {
        return (
            <img
                src={iconUrl}
                referrerPolicy="no-referrer"
                alt={name}
                className="aspect-square"
                style={{ width: size }}
                onError={() => setImageLoadFailed(true)}
            />
        )
    } else {
        return (
            <div
                className={classNames(
                    "flex items-center justify-center",
                    "font-bold disabled:text-current/80 text-shadow-[0px_0px_5px] text-shadow-black",
                    "aspect-square p-sm text-white rounded-full group-disabled:opacity-disabled",
                    "bg-[url(/extensions-icon-default.svg)] bg-cover",
                )}
                style={{ width: size, fontSize: `calc(${size}*0.3)` }}
            >
                {name
                    .split(" ", 2)
                    .map((part) => part.charAt(0))
                    .join("")}
            </div>
        )
    }
}
