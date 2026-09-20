import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

export async function optimizeImportsInDocument(document: vscode.TextDocument): Promise<vscode.WorkspaceEdit | null> {
    const text = document.getText();
    const sourceFile = ts.createSourceFile(
        document.fileName,
        text,
        ts.ScriptTarget.Latest,
        true,
        document.fileName.endsWith('.tsx') || document.fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const imports: ts.ImportDeclaration[] = [];
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node)) {
            imports.push(node);
        }
    });

    if (imports.length === 0) {
        return null;
    }

    // Group imports by directory path
    const groups = new Map<string, ts.ImportDeclaration[]>();
    for (const imp of imports) {
        if (ts.isStringLiteral(imp.moduleSpecifier)) {
            const modulePath = imp.moduleSpecifier.text;
            // E.g., "@/pages/HomePage" -> dirname: "@/pages", basename: "HomePage"
            const lastSlash = modulePath.lastIndexOf('/');
            if (lastSlash > 0) { // Has a directory part
                const dir = modulePath.substring(0, lastSlash);
                if (!groups.has(dir)) {
                    groups.set(dir, []);
                }
                groups.get(dir)!.push(imp);
            }
        }
    }

    const edit = new vscode.WorkspaceEdit();
    let madeChanges = false;

    // We need to keep track of the ranges to replace and the new strings.
    // To safely replace, we should process from the bottom to the top so ranges don't shift.
    // Or just create a replacement for the entire imports block.
    // For now, let's just do a naive approach: if a group has >1 import, we merge them into `dir`.

    // In a real robust implementation, we would check if `dir/index.ts` exists.
    // For MVP, we will merge them assuming a barrel exists or will be created.

    const { ConfigResolver } = require('./configResolver');
    const configResolver = ConfigResolver.getInstance();
    
    for (const [dir, group] of groups.entries()) {
        if (group.length > 1) {
            // Check if directory points to a valid barrel
            let resolvedDir = '';
            if (dir.startsWith('.')) {
                // Relative path
                resolvedDir = path.resolve(path.dirname(document.fileName), dir);
            } else {
                // Alias path
                const res = configResolver.resolveImportPath(dir);
                if (res) resolvedDir = res;
            }

            const barrelFilename = configResolver.getFsdConfig().barrel.filename;
            let barrelExists = false;

            if (resolvedDir) {
                const tsPath = path.join(resolvedDir, barrelFilename);
                const tsxPath = path.join(resolvedDir, barrelFilename.replace('.ts', '.tsx'));
                const jsPath = path.join(resolvedDir, barrelFilename.replace('.ts', '.js'));
                barrelExists = fs.existsSync(tsPath) || fs.existsSync(tsxPath) || fs.existsSync(jsPath);
            }

            if (!barrelExists) {
                vscode.window.showWarningMessage(`Cannot optimize imports because barrel ${barrelFilename} does not exist in ${dir}.`, 'Generate Barrel', 'Cancel').then(choice => {
                    if (choice === 'Generate Barrel') {
                        vscode.commands.executeCommand('fsd-architect.generateBarrel', vscode.Uri.file(resolvedDir || dir));
                    }
                });
                continue; // Do not optimize
            }

            // Merge them
            const namedImports = new Set<string>();
            
            for (const imp of group) {
                if (imp.importClause) {
                    if (imp.importClause.name) {
                        namedImports.add(imp.importClause.name.text);
                    }
                    if (imp.importClause.namedBindings && ts.isNamedImports(imp.importClause.namedBindings)) {
                        for (const el of imp.importClause.namedBindings.elements) {
                            namedImports.add(el.name.text);
                        }
                    }
                }
            }

            if (namedImports.size > 0) {
                const newImportStr = `import {\n  ${Array.from(namedImports).sort().join(',\n  ')}\n} from "${dir}";\n`;
                
                // Remove old imports safely
                for (let i = 0; i < group.length; i++) {
                    const imp = group[i];
                    const range = new vscode.Range(
                        document.positionAt(imp.getStart(sourceFile)),
                        document.positionAt(imp.getEnd())
                    );
                    
                    if (i === 0) {
                        edit.replace(document.uri, range, newImportStr.trim());
                    } else {
                        const endPos = imp.getEnd();
                        let deleteEnd = endPos;
                        if (text[endPos] === '\n') deleteEnd++;
                        else if (text[endPos] === '\r' && text[endPos+1] === '\n') deleteEnd += 2;
                        
                        const deleteRange = new vscode.Range(
                            document.positionAt(imp.getStart(sourceFile)),
                            document.positionAt(deleteEnd)
                        );
                        edit.delete(document.uri, deleteRange);
                    }
                }
                madeChanges = true;
            }
        }
    }

    return madeChanges ? edit : null;
}
