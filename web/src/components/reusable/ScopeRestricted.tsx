import type { ReactNode } from "react"

import type { OAuth2Scope } from "@/api/openapi"
import useUserSession from "@/hooks/userSessionHook"

export interface ScopeRestrictedProps {
    readonly expected: readonly OAuth2Scope[]
    readonly children?: ReactNode | ((options: { satisfied: boolean }) => ReactNode)
}

export default function ScopeRestricted({ expected, children }: ScopeRestrictedProps) {
    const { current } = useUserSession()
    const actual = current?.scopes ?? []
    const satisfied = expected.every((scope) => actual.includes(scope))
    if (typeof children === "function") {
        return children({ satisfied })
    } else {
        return satisfied && children
    }
}
