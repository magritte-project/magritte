import classNames from "classnames"

export type LibraryArtistListProps = React.HTMLAttributes<HTMLOListElement>

export default function LibraryArtistList({ className, ...rest }: LibraryArtistListProps) {
    return <ol className={classNames("flex flex-col", className)} {...rest} />
}
