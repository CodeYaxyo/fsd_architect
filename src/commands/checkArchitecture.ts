import * as vscode from 'vscode';
import { checkArchitectureForDocument } from '../core/architectureGuard';

export function registerCheckArchitectureCommand() {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('fsd-architect');

    // Run on active editor change
    vscode.window.onDidChangeActiveTextEditor(async editor => {
        if (editor) {
            const diagnostics = await checkArchitectureForDocument(editor.document);
            diagnosticCollection.set(editor.document.uri, diagnostics);
        }
    });

    // Run on save
    vscode.workspace.onDidSaveTextDocument(async document => {
        const diagnostics = await checkArchitectureForDocument(document);
        diagnosticCollection.set(document.uri, diagnostics);
    });

    return vscode.commands.registerCommand('fsd-architect.checkArchitecture', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor to check.');
            return;
        }

        const diagnostics = await checkArchitectureForDocument(editor.document);
        diagnosticCollection.set(editor.document.uri, diagnostics);
        
        if (diagnostics.length > 0) {
            vscode.window.showErrorMessage(`FSD Architect: Found ${diagnostics.length} architecture violations in this file.`);
        } else {
            vscode.window.showInformationMessage('FSD Architect: Architecture check passed for this file.');
        }
    });
}
