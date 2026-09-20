import * as ts from 'typescript';
import * as path from 'path';
import { ConfigResolver } from './configResolver';

export interface ArchitectureViolation {
    message: string;
    range: { start: number; end: number };
    severity: 'error' | 'warning';
}

export class ArchitectureEngine {
    public static validateDocument(
        filePath: string,
        fileContent: string,
        configResolver: ConfigResolver
    ): ArchitectureViolation[] {
        const violations: ArchitectureViolation[] = [];
        const fsdConfig = configResolver.getFsdConfig();
        const layers = fsdConfig.layers;

        const normalizedPath = filePath.replace(/\\/g, '/');
        let currentLayerIndex = -1;
        let currentSliceName = '';
        
        const nextJsAppRouterFiles = ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'template.tsx', 'default.tsx', 'route.ts', 'page.jsx', 'layout.jsx'];
        const fileName = path.basename(filePath);
        
        if (nextJsAppRouterFiles.includes(fileName) && (normalizedPath.includes('/app/') || normalizedPath.includes('/pages/'))) {
            // This is a Next.js routing file, not inherently part of an FSD layer boundary check,
            // though it usually imports FROM FSD layers. We can treat its layer index as infinity (highest).
            currentLayerIndex = layers.length; // highest possible layer
        } else {
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                const match = normalizedPath.match(new RegExp(`/${layer}/([^/]+)/`));
                if (match) {
                    currentLayerIndex = i;
                    currentSliceName = match[1];
                    break;
                } else if (normalizedPath.includes(`/${layer}/`)) {
                    currentLayerIndex = i;
                    break;
                }
            }
        }

        if (currentLayerIndex === -1) {
            return violations; // Not in an FSD layer
        }

        const sourceFile = ts.createSourceFile(
            filePath,
            fileContent,
            ts.ScriptTarget.Latest,
            true,
            filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        ts.forEachChild(sourceFile, (node) => {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                const importPath = node.moduleSpecifier.text;
                
                let importedLayerIndex = -1;
                let importedSliceName = '';
                
                for (let i = 0; i < layers.length; i++) {
                    const layer = layers[i];
                    if (importPath.includes(`/${layer}/`) || importPath.startsWith(`@/${layer}`) || importPath.startsWith(`~/${layer}`)) {
                        importedLayerIndex = i;
                        const match = importPath.match(new RegExp(`(?:/|@/|~/)${layer}/([^/]+)`));
                        if (match) {
                            importedSliceName = match[1];
                        }
                        break;
                    }
                }

                if (importedLayerIndex > -1) {
                    // Rule 1: Cannot import from higher layers
                    if (importedLayerIndex > currentLayerIndex) {
                        violations.push({
                            message: `FSD Architect: ${layers[currentLayerIndex]} must not import from higher layer ${layers[importedLayerIndex]}.`,
                            range: { start: node.getStart(sourceFile), end: node.getEnd() },
                            severity: 'error'
                        });
                    }

                    // Rule 2: Cross-imports should use public API barrels
                    if (importedLayerIndex === currentLayerIndex && layers[currentLayerIndex] !== 'shared') {
                        if (importedSliceName && importedSliceName !== currentSliceName) {
                            const match = importPath.match(new RegExp(`(?:/|@/|~/)${layers[importedLayerIndex]}/${importedSliceName}/(.+)`));
                            if (match && match[1] !== 'index' && match[1] !== 'index.ts' && match[1] !== 'index.js') {
                                violations.push({
                                    message: `FSD Architect: Cross-import between slices should use public API barrels. Do not import internals of '${importedSliceName}'.`,
                                    range: { start: node.getStart(sourceFile), end: node.getEnd() },
                                    severity: 'warning'
                                });
                            }
                        }
                    }
                }
            }
        });

        return violations;
    }
}
