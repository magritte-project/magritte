import "@/actions/env"
import { importJWK, importPKCS8, SignJWT } from "jose"

export async function getDeveloperToken(): Promise<{ developerToken: string }> {
    const teamId = process.env["TEAM_ID"]
    const appId = process.env["APP_ID"]
    const keyId = process.env["KEY_ID"]
    const privateKey = process.env["KEY_SECRET"]
    if (!teamId || !appId || !keyId || !privateKey) {
        throw new Error("Extension not configured with credentials")
    }

    const privateKeyPKCS8 = privateKey.startsWith("{")
        ? await importJWK(JSON.parse(privateKey), "ES256")
        : await importPKCS8(privateKey, "ES256")

    const signBearerTokenPayload = new SignJWT({ sub: appId })
        .setIssuer(teamId)
        .setIssuedAt()
        .setExpirationTime(process.env["EXPIRATION_TIME"] ?? "24 h")
        .setProtectedHeader({
            alg: "ES256",
            kid: keyId,
            typ: "JWT",
        })
    const developerToken = await signBearerTokenPayload.sign(privateKeyPKCS8)
    return { developerToken }
}
