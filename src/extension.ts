import * as vscode from 'vscode';
import { registerGenerateBarrelCommand } from './commands/generateBarrel';
import { registerOptimizeImportsCommand } from './commands/optimizeImports';
import { registerOrganizeImportsCommand } from './commands/organizeImports';
import { registerCheckArchitectureCommand } from './commands/checkArchitecture';
import { registerSliceGenerators } from './commands/sliceGenerators';
import { registerShowGraphCommand } from './commands/showGraph';
import { FsdSidebarProvider } from './ui/sidebarProvider';
import { FsdCodeActionProvider } from './ui/codeActionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('FSD Architect is now active!');

    const sidebarProvider = new FsdSidebarProvider();
    vscode.window.registerTreeDataProvider('fsd-architect-tools', sidebarProvider);

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
            new FsdCodeActionProvider(),
            { providedCodeActionKinds: FsdCodeActionProvider.providedCodeActionKinds }
        )
    );

    context.subscriptions.push(registerGenerateBarrelCommand());
    context.subscriptions.push(registerOptimizeImportsCommand());
    context.subscriptions.push(registerOrganizeImportsCommand());
    context.subscriptions.push(registerCheckArchitectureCommand());
    context.subscriptions.push(registerShowGraphCommand());
    context.subscriptions.push(...registerSliceGenerators());
}

export function deactivate() {}
