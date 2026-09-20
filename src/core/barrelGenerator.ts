import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseExports } from './parser';

export async function generateBarrelForFolder(folderPath: string) {
    const files = fs.readdirSync(folderPath);
    const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
    
    // exclude existing index files
    const sourceFiles = tsFiles.filter(f => !f.startsWith('index.'));
    
    if (sourceFiles.length === 0) {
        vscode.window.showInformationMessage('No source files found to export.');
        return;
    }

    const barrelLines: string[] = [];
    const exportedNames = new Set<string>();
    
    for (const file of sourceFiles) {
        const fullPath = path.join(folderPath, file);
        const parsedExports = parseExports(fullPath);
        const fileNameWithoutExt = path.parse(file).name;
        
        const namedExports = parsedExports.filter(e => !e.isDefault && !e.isType);
        const typeExports = parsedExports.filter(e => !e.isDefault && e.isType);
        const defaultExport = parsedExports.find(e => e.isDefault);

        if (defaultExport) {
            const exportName = defaultExport.name || fileNameWithoutExt;
            if (!exportedNames.has(exportName)) {
                barrelLines.push(`export { default as ${exportName} } from './${fileNameWithoutExt}';`);
                exportedNames.add(exportName);
            } else {
                vscode.window.showWarningMessage(`Conflict detected: Export '${exportName}' already exists. Skipping default export from ${fileNameWithoutExt}.`);
            }
        }
        
        if (namedExports.length > 0) {
            const safeExports = namedExports.filter(e => {
                if (exportedNames.has(e.name)) {
                    vscode.window.showWarningMessage(`Conflict detected: Export '${e.name}' already exists. Skipping from ${fileNameWithoutExt}.`);
                    return false;
                }
                exportedNames.add(e.name);
                return true;
            });
            
            if (safeExports.length > 0) {
                const names = safeExports.map(e => e.name).join(', ');
                barrelLines.push(`export { ${names} } from './${fileNameWithoutExt}';`);
            }
        }

        if (typeExports.length > 0) {
            const safeTypeExports = typeExports.filter(e => {
                if (exportedNames.has(e.name)) {
                    vscode.window.showWarningMessage(`Conflict detected: Type export '${e.name}' already exists. Skipping from ${fileNameWithoutExt}.`);
                    return false;
                }
                exportedNames.add(e.name);
                return true;
            });

            if (safeTypeExports.length > 0) {
                const typeNames = safeTypeExports.map(e => e.name).join(', ');
                barrelLines.push(`export type { ${typeNames} } from './${fileNameWithoutExt}';`);
            }
        }
    }

    if (barrelLines.length === 0) {
        vscode.window.showInformationMessage('No exports found in the files.');
        return;
    }

    const barrelPath = path.join(folderPath, 'index.ts');
    
    const existingContent = fs.existsSync(barrelPath) ? fs.readFileSync(barrelPath, 'utf8') : '';
    const newContent = barrelLines.join('\n') + '\n';
    
    if (existingContent === newContent) {
        vscode.window.showInformationMessage('Barrel file is already up to date.');
        return;
    }

    fs.writeFileSync(barrelPath, newContent, 'utf8');
    vscode.window.showInformationMessage(`Generated barrel at ${barrelPath}`);
}
