import * as vscode from 'vscode';
import { ArchitectureEngine } from './architectureEngine';
import { ConfigResolver } from './configResolver';

export async function checkArchitectureForDocument(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const configResolver = ConfigResolver.getInstance();
    await configResolver.loadConfig(); // Ensure config is loaded

    const violations = ArchitectureEngine.validateDocument(
        document.fileName,
        document.getText(),
        configResolver
    );

    return violations.map(v => {
        const range = new vscode.Range(
            document.positionAt(v.range.start),
            document.positionAt(v.range.end)
        );
        return new vscode.Diagnostic(
            range,
            v.message,
            v.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
        );
    });
}
