import * as vscode from 'vscode';
import * as path from 'path';

export class FsdCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.message.includes('FSD Architect:')) {
                // Determine action based on error message
                
                // For cross import barrel violation:
                if (diagnostic.message.includes('should use public API barrels')) {
                    const fix = new vscode.CodeAction('Use public API barrel (FSD)', vscode.CodeActionKind.QuickFix);
                    fix.diagnostics = [diagnostic];
                    fix.isPreferred = true;
                    // We can execute the optimize imports command on this range/document as a quick fix
                    fix.command = {
                        command: 'fsd-architect.optimizeImports',
                        title: 'Optimize FSD Imports',
                        tooltip: 'Fixes this import to use the public barrel'
                    };
                    actions.push(fix);
                }
                
                // For higher layer import violation:
                if (diagnostic.message.includes('must not import from higher layer')) {
                    const explain = new vscode.CodeAction('Explain violation (FSD)', vscode.CodeActionKind.QuickFix);
                    explain.diagnostics = [diagnostic];
                    explain.command = {
                        command: 'vscode.open',
                        arguments: [vscode.Uri.parse('https://feature-sliced.design/docs/reference/layers')],
                        title: 'Read FSD Layer Docs'
                    };
                    actions.push(explain);
                }
            }
        }

        return actions;
    }
}
