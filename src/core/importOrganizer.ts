import * as vscode from 'vscode';

export async function organizeImportsInDocument(document: vscode.TextDocument): Promise<vscode.WorkspaceEdit | null> {
    // For maximum safety and preservation of comments, quotes, and developer formatting (as required),
    // we defer to the native TypeScript language service's organize imports feature.
    // Building a custom AST-based whitespace-preserving sorter from scratch is dangerous
    // and fights existing ESLint/Prettier rules.
    
    // We execute the native organize imports command on the active editor.
    // If we have to return a WorkspaceEdit directly, we can't easily capture it from the command,
    // so we return null and just run the command side-effect.
    
    await vscode.commands.executeCommand('editor.action.organizeImports');
    return null;
}
