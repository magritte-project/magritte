import { loadScript } from "@/utilities/loadScript"

export async function initializeMusicKit(
    config: MusicKit.Configuration,
): Promise<MusicKit.Instance> {
    if ("process" in window && !("version" in window.process)) {
        const windowThatSatisfiesTheTypeChecker = window as any
        delete windowThatSatisfiesTheTypeChecker.process
    }
    await loadScript("https://js-cdn.music.apple.com/musickit/v3/musickit.js")
    await new Promise<void>((resolve) => {
        if ("MusicKit" in window) {
            resolve()
        } else {
            document.addEventListener("musickitloaded", () => {
                resolve()
            })
        }
    })
    const instance = await MusicKit.configure(config)
    console.info("MusicKit ready")
    return instance
}
