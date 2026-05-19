export interface MusicKitTokenFactory {
    /** Create a developer token using this factory's credentials and settings */
    createDeveloperToken(): Promise<string>
}
