import * as vscode from 'vscode';
import { organizeImportsInDocument } from '../core/importOrganizer';

export function registerOrganizeImportsCommand() {
    return vscode.commands.registerCommand('fsd-architect.organizeImports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor.');
            return;
        }

        try {
            const edit = await organizeImportsInDocument(editor.document);
            if (edit) {
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Imports organized.');
            } else {
                vscode.window.showInformationMessage('No imports to organize.');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to organize imports: ${error.message}`);
        }
    });
}
