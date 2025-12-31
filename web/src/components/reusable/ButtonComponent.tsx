import type { ReactNode } from "react"

export type ButtonComponentProps = React.ButtonHTMLAttributes<HTMLButtonElement>
export type ButtonComponent = (props: ButtonComponentProps) => ReactNode

export function DefaultButtonComponent(props: ButtonComponentProps) {
    return <button {...props} />
}
