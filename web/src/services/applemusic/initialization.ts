/** Wait for the MusicKit global to be ready */
export default function waitForMusicKit(): Promise<void> {
    return new Promise<void>((resolve) => {
        if ("MusicKit" in window) {
            resolve()
        } else {
            document.addEventListener("musickitloaded", () => {
                resolve()
            })
        }
    })
}
