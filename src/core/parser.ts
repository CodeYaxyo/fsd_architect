import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface FileExport {
    name: string;
    isDefault: boolean;
    isType: boolean;
}

export function parseExports(filePath: string): FileExport[] {
    const exports: FileExport[] = [];
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
        path.basename(filePath),
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    function visit(node: ts.Node) {
        // Handle `export default ...`
        if (ts.isExportAssignment(node)) {
            // e.g. export default HomePage;
            if (ts.isIdentifier(node.expression)) {
                exports.push({
                    name: node.expression.text,
                    isDefault: true,
                    isType: false
                });
            } else {
                // Anonymous export, we might need to fallback to filename, but for now we'll handle it later
            }
        }

        // Handle `export function foo()`, `export class Foo`
        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
            if (isExported) {
                const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) || false;
                const isType = ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
                
                if (node.name) {
                    exports.push({
                        name: node.name.text,
                        isDefault,
                        isType
                    });
                } else if (isDefault) {
                    // Anonymous default export
                    exports.push({
                        name: '', // We'll infer from filename later
                        isDefault,
                        isType
                    });
                }
            }
        }

        // Handle `export const foo = ...`
        if (ts.isVariableStatement(node)) {
            const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
            if (isExported) {
                for (const decl of node.declarationList.declarations) {
                    if (ts.isIdentifier(decl.name)) {
                        exports.push({
                            name: decl.name.text,
                            isDefault: false,
                            isType: false
                        });
                    }
                }
            }
        }

        // Handle `export { foo, bar }`
        if (ts.isExportDeclaration(node)) {
            if (node.exportClause && ts.isNamedExports(node.exportClause)) {
                for (const el of node.exportClause.elements) {
                    exports.push({
                        name: el.name.text,
                        isDefault: false,
                        isType: node.isTypeOnly || el.isTypeOnly
                    });
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return exports;
}
