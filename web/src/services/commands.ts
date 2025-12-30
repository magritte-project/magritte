import type { ServiceCommands } from "@/services/types";
import { getCommandsForAppleMusic } from "./applemusic/commands";
import type { JsonStructure } from "react-cmdk";
import { getInitializedServiceNames } from "@/services/initialization";

const COMMANDS: Record<string, ServiceCommands> = {
    applemusic: getCommandsForAppleMusic,
}

export default function getServiceCommands(): JsonStructure {
    const commands: JsonStructure = []
    const serviceNames = getInitializedServiceNames()
    for (const serviceName of serviceNames) {
        const getCommands = COMMANDS[serviceName]
        if (!getCommands) {
            console.info(
                `Skipping service without commands: ${serviceName}`,
            )
            continue
        }
        commands.push(...getCommands())
    }
    return commands
}
