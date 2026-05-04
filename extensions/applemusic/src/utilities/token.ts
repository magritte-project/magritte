import { importPKCS8, SignJWT } from "jose"

export interface CreateDeveloperTokenOptions {
    readonly teamId: string
    readonly appId: string
    readonly keyId: string
    readonly privateKey: string
    readonly expirationTime?: string | number | Date
}

export default async function createDeveloperToken(options: CreateDeveloperTokenOptions) {
    const privateKeyPKCS8 = await importPKCS8(options.privateKey, "ES256")
    const signBearerTokenPayload = new SignJWT({ sub: options.appId })
        .setIssuer(options.teamId)
        .setIssuedAt()
        .setExpirationTime(options.expirationTime ?? "24 h")
        .setProtectedHeader({
            alg: "ES256",
            kid: options.keyId,
            typ: "JWT",
        })
    return await signBearerTokenPayload.sign(privateKeyPKCS8)
}
