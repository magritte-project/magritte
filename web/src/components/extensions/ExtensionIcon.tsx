import classNames from "classnames"

const COLOR_CLASSES = [
    "bg-red-500 group-active:bg-red-600 group-disabled:bg-red-300",
    "bg-orange-500 group-active:bg-orange-600 group-disabled:bg-orange-300",
    "bg-amber-500 group-active:bg-amber-600 group-disabled:bg-amber-300",
    "bg-yellow-500 group-active:bg-yellow-600 group-disabled:bg-yellow-300",
    "bg-lime-500 group-active:bg-lime-600 group-disabled:bg-lime-300",
    "bg-green-500 group-active:bg-green-600 group-disabled:bg-green-300",
    "bg-emerald-500 group-active:bg-emerald-600 group-disabled:bg-emerald-300",
    "bg-teal-500 group-active:bg-teal-600 group-disabled:bg-teal-300",
    "bg-cyan-500 group-active:bg-cyan-600 group-disabled:bg-cyan-300",
    "bg-sky-500 group-active:bg-sky-600 group-disabled:bg-sky-300",
    "bg-blue-500 group-active:bg-blue-600 group-disabled:bg-blue-300",
    "bg-indigo-500 group-active:bg-indigo-600 group-disabled:bg-indigo-300",
    "bg-violet-500 group-active:bg-violet-600 group-disabled:bg-violet-300",
    "bg-purple-500 group-active:bg-purple-600 group-disabled:bg-purple-300",
    "bg-fuchsia-500 group-active:bg-fuchsia-600 group-disabled:bg-fuchsia-300",
    "bg-pink-500 group-active:bg-pink-600 group-disabled:bg-pink-300",
    "bg-rose-500 group-active:bg-rose-600 group-disabled:bg-rose-300",
    "bg-slate-500 group-active:bg-slate-600 group-disabled:bg-slate-300",
    "bg-zinc-500 group-active:bg-zinc-600 group-disabled:bg-zinc-300",
    "bg-taupe-500 group-active:bg-taupe-600 group-disabled:bg-taupe-300",
    "bg-mauve-500 group-active:bg-mauve-600 group-disabled:bg-mauve-300",
    "bg-mist-500 group-active:bg-mist-600 group-disabled:bg-mist-300",
    "bg-olive-500 group-active:bg-olive-600 group-disabled:bg-olive-300",
]

export interface ExtensionIconProps {
    readonly iconUrl?: string | null
    readonly name: string
    readonly size?: string
}

export default function ExtensionIcon({ iconUrl, name, size = "2rem" }: ExtensionIconProps) {
    if (iconUrl) {
        return <img src={iconUrl} alt={name} className="aspect-square" style={{ width: size }} />
    } else {
        return (
            <div
                className={classNames(
                    "flex items-center justify-center",
                    "text-white font-medium",
                    "border border-black/10 group-data-active:border-black/50",
                    "aspect-square rounded-full",
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
