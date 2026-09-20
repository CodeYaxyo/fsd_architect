import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

export interface FsdConfig {
    layers: string[];
    sliceFolders: string[];
    barrel: {
        filename: string;
    };
}

export const DEFAULT_FSD_CONFIG: FsdConfig = {
    layers: ['shared', 'entities', 'features', 'widgets', 'pages', 'app'],
    sliceFolders: ['ui', 'model', 'api', 'lib'],
    barrel: {
        filename: 'index.ts'
    }
};

export class ConfigResolver {
    private static instance: ConfigResolver;
    private tsConfigPaths: Map<string, string[]> = new Map();
    private baseUrl: string = '';
    private workspaceRoot: string = '';
    private fsdConfig: FsdConfig = { ...DEFAULT_FSD_CONFIG };

    private constructor() {}

    public static getInstance(): ConfigResolver {
        if (!ConfigResolver.instance) {
            ConfigResolver.instance = new ConfigResolver();
        }
        return ConfigResolver.instance;
    }

    public async loadConfig() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) return;

        this.workspaceRoot = workspaceFolders[0].uri.fsPath;

        // Load tsconfig
        const tsconfigPath = path.join(this.workspaceRoot, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
            const parsedCommandLine = ts.parseJsonConfigFileContent(
                configFile.config,
                ts.sys,
                this.workspaceRoot
            );
            const options = parsedCommandLine.options;
            if (options.baseUrl) {
                this.baseUrl = options.baseUrl;
            } else {
                this.baseUrl = this.workspaceRoot;
            }
            if (options.paths) {
                this.tsConfigPaths.clear();
                for (const [key, values] of Object.entries(options.paths)) {
                    this.tsConfigPaths.set(key, values as string[]);
                }
            }
        } else {
            this.baseUrl = this.workspaceRoot;
        }

        // Load fsd-architect.config.json
        const fsdConfigPath = path.join(this.workspaceRoot, 'fsd-architect.config.json');
        if (fs.existsSync(fsdConfigPath)) {
            try {
                const content = fs.readFileSync(fsdConfigPath, 'utf8');
                const parsed = JSON.parse(content);
                this.fsdConfig = {
                    ...DEFAULT_FSD_CONFIG,
                    ...parsed,
                    barrel: { ...DEFAULT_FSD_CONFIG.barrel, ...(parsed.barrel || {}) }
                };
            } catch (e) {
                vscode.window.showErrorMessage('Invalid fsd-architect.config.json format.');
            }
        }
    }

    public getFsdConfig(): FsdConfig {
        return this.fsdConfig;
    }

    public getWorkspaceRoot(): string {
        return this.workspaceRoot;
    }

    public resolveImportPath(importPath: string): string | null {
        // Handle absolute aliases based on tsconfig paths
        if (!this.workspaceRoot) return null;

        // Try exact match first
        for (const [alias, paths] of this.tsConfigPaths.entries()) {
            // exact match
            if (alias === importPath) {
                return path.join(this.baseUrl, paths[0]);
            }
            // wildcard match e.g., "@/*"
            if (alias.endsWith('/*')) {
                const prefix = alias.slice(0, -2);
                if (importPath.startsWith(prefix + '/')) {
                    const suffix = importPath.slice(prefix.length + 1);
                    const targetPath = paths[0].replace('*', suffix);
                    return path.join(this.baseUrl, targetPath);
                }
            }
        }

        // Fallback assuming it might be a relative path resolving logic, but here we mainly care about aliases.
        return null;
    }
}
