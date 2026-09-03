import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import classNames from "classnames"

export type ThemedInputSearchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

export default function ThemedSearchInput({ className, ...rest }: ThemedInputSearchProps) {
    return (
        <div className="relative">
            <input
                type="search"
                className={classNames(
                    "bg-primary rounded-full py-2 pl-10 pr-4 min-w-0 w-auto",
                    "text-on-primary placeholder:text-placeholder",
                    "border border-outline focus:border-outline-focus outline-0",
                    className,
                )}
                {...rest}
            />
            <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                size="calc(var(--spacing) * 5)"
                aria-hidden
            />
        </div>
    )
}
