import { importJWK, importPKCS8, SignJWT } from "jose"

import type { MusicKitTokenFactory } from "@/musickit/tokens/base"

export interface ClientTokenFactoryOptions {
    readonly teamId: string
    readonly appId: string
    readonly keyId: string
    readonly privateKey: string
    readonly expirationTime?: string | number | Date
}

export class ClientTokenFactory implements MusicKitTokenFactory {
    constructor(private readonly options: ClientTokenFactoryOptions) {
        if (!options.teamId) {
            throw new Error("team id is required for MusicKit")
        }
        if (!options.appId) {
            throw new Error("app id is required for MusicKit")
        }
        if (!options.keyId) {
            throw new Error("key id is required for MusicKit")
        }
        if (!options.privateKey) {
            throw new Error("private key is required for MusicKit")
        }
    }

    async createDeveloperToken(): Promise<string> {
        const privateKeyPKCS8 = this.options.privateKey.startsWith("{")
            ? await importJWK(JSON.parse(this.options.privateKey), "ES256")
            : await importPKCS8(this.options.privateKey, "ES256")

        const signBearerTokenPayload = new SignJWT({ sub: this.options.appId })
            .setIssuer(this.options.teamId)
            .setIssuedAt()
            .setExpirationTime(this.options.expirationTime ?? "24 h")
            .setProtectedHeader({
                alg: "ES256",
                kid: this.options.keyId,
                typ: "JWT",
            })
        return await signBearerTokenPayload.sign(privateKeyPKCS8)
    }
}
