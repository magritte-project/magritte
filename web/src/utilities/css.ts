import { camelCaseToKebabCase } from "@/utilities/strings"

export function getPropertyName(name: string, ...prefixes: string[]): string {
    return `--${[...prefixes, name].map(camelCaseToKebabCase).join("-")}`
}
