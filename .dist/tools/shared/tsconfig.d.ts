interface TsConfig {
    compilerOptions?: {
        baseUrl?: string;
        jsx?: string;
        paths?: Record<string, string[]>;
    };
    extends?: string | string[];
}
export interface AliasConfig {
    /** Glob patterns for path aliases, mapped to their replacement targets */
    aliasPatterns: Record<string, string[]>;
    /** Directory that `paths` entries are resolved against */
    basePath: string;
}
/**
 * Removes `//` and block comments plus trailing commas, skipping the contents
 * of string literals so values like "http://localhost" survive
 */
export declare function stripJsonComments(source: string): string;
/**
 * Reads `tsconfig.json` from `cwd` with relative `extends` chains merged in.
 * Returns `{}` when the file is missing or unreadable
 */
export declare function loadTsConfig(cwd: string): TsConfig;
export declare function loadTsConfigAliases(cwd: string): AliasConfig;
export {};
