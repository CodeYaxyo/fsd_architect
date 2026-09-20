import * as vscode from 'vscode';
import { generateBarrelForFolder } from '../core/barrelGenerator';
import * as path from 'path';
import * as fs from 'fs';

export function registerGenerateBarrelCommand() {
    return vscode.commands.registerCommand('fsd-architect.generateBarrel', async (uri: vscode.Uri) => {
        let targetPath = '';
        
        if (uri && uri.fsPath) {
            targetPath = uri.fsPath;
        } else {
            // Fallback to currently open file's directory if command palette is used
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                targetPath = path.dirname(activeEditor.document.uri.fsPath);
            } else {
                vscode.window.showErrorMessage('No folder selected for barrel generation.');
                return;
            }
        }
        
        const stat = fs.statSync(targetPath);
        if (!stat.isDirectory()) {
            targetPath = path.dirname(targetPath);
        }

        try {
            await generateBarrelForFolder(targetPath);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to generate barrel: ${error.message}`);
        }
    });
}
