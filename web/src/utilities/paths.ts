export function removeLastPathComponent(path: string) {
    if (path === "/") {
        return path
    } else {
        const trailingSlashIndex = path.lastIndexOf("/")
        if (trailingSlashIndex === -1) {
            return path
        }
        const baseName = path.slice(0, trailingSlashIndex)
        if (baseName === "") {
            return "/"
        } else {
            return baseName
        }
    }
}

export function appendPathComponent(baseName: string, name: string) {
    let fullPath = baseName
    if (!fullPath.endsWith("/")) {
        fullPath += "/"
    }
    if (name.startsWith("/")) {
        fullPath += name.slice(1)
    } else {
        fullPath += name
    }
    return fullPath
}

export function lastPathComponent(path: string) {
    if (path === "/") {
        return path
    }
    return (
        path
            .split("/")
            .reverse()
            .find((component) => component !== "") ?? ""
    )
}
