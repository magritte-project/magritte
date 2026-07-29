import classNames from "classnames"

const COLOR_CLASSES = [
    "text-red-500 group-disabled:text-red-300",
    "text-orange-500 group-disabled:text-orange-300",
    "text-amber-500 group-disabled:text-amber-300",
    "text-yellow-500 group-disabled:text-yellow-300",
    "text-lime-500 group-disabled:text-lime-300",
    "text-green-500 group-disabled:text-green-300",
    "text-emerald-500 group-disabled:text-emerald-300",
    "text-teal-500 group-disabled:text-teal-300",
    "text-cyan-500 group-disabled:text-cyan-300",
    "text-sky-500 group-disabled:text-sky-300",
    "text-blue-500 group-disabled:text-blue-300",
    "text-indigo-500 group-disabled:text-indigo-300",
    "text-violet-500 group-disabled:text-violet-300",
    "text-purple-500 group-disabled:text-purple-300",
    "text-fuchsia-500 group-disabled:text-fuchsia-300",
    "text-pink-500 group-disabled:text-pink-300",
    "text-rose-500 group-disabled:text-rose-300",
    "text-slate-500 group-disabled:text-slate-300",
    "text-zinc-500 group-disabled:text-zinc-300",
    "text-taupe-500 group-disabled:text-taupe-300",
    "text-mauve-500 group-disabled:text-mauve-300",
    "text-mist-500 group-disabled:text-mist-300",
    "text-olive-500 group-disabled:text-olive-300",
]

export interface ExtensionIconProps {
    readonly iconUrl?: string | null
    readonly name: string
    readonly size?: string
}

export default function ExtensionIcon({ iconUrl, name, size = "2rem" }: ExtensionIconProps) {
    if (iconUrl) {
        return (
            <img
                src={iconUrl}
                referrerPolicy="no-referrer"
                alt={name}
                className="aspect-square"
                style={{ width: size }}
            />
        )
    } else {
        return (
            <div
                className={classNames(
                    "flex items-center justify-center",
                    "font-medium disabled:text-current/80",
                    "border border-current bg-black/5 group-active:bg-black/10",
                    "aspect-square p-1 text-[90%] rounded-full",
                    COLOR_CLASSES[name.length % COLOR_CLASSES.length],
                )}
                style={{ width: size }}
            >
                {name
                    .split(" ", 2)
                    .map((part) => part.charAt(0))
                    .join("")}
            </div>
        )
    }
}
