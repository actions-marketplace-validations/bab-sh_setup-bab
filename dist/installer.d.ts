interface InstallResult {
    version: string;
    path: string;
}
export declare function getBab(versionSpec: string, repoToken: string): Promise<InstallResult>;
export {};
