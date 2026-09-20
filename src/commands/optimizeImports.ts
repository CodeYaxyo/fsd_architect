import * as vscode from 'vscode';
import { optimizeImportsInDocument } from '../core/importOptimizer';

export function registerOptimizeImportsCommand() {
    return vscode.commands.registerCommand('fsd-architect.optimizeImports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor.');
            return;
        }

        try {
            const edit = await optimizeImportsInDocument(editor.document);
            if (edit) {
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Imports optimized.');
            } else {
                vscode.window.showInformationMessage('No imports to optimize.');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to optimize imports: ${error.message}`);
        }
    });
}
