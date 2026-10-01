import classNames from "classnames"

export type LibraryAlbumListProps = React.HTMLAttributes<HTMLOListElement>

export default function LibraryAlbumList({ className, ...rest }: LibraryAlbumListProps) {
    return (
        <ol
            className={classNames("flex items-start content-start flex-wrap gap-lg", className)}
            {...rest}
        />
    )
}
