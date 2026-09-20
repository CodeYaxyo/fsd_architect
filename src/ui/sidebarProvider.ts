import * as vscode from 'vscode';

export class FsdSidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            return Promise.resolve([
                this.createCategory('Architecture', [
                    this.createCommandItem('Check Architecture', 'fsd-architect.checkArchitecture', 'search'),
                    this.createCommandItem('Show Graph', 'fsd-architect.showGraph', 'type-hierarchy')
                ]),
                this.createCategory('Imports', [
                    this.createCommandItem('Optimize Imports', 'fsd-architect.optimizeImports', 'zap'),
                    this.createCommandItem('Organize Imports', 'fsd-architect.organizeImports', 'list-ordered'),
                    this.createCommandItem('Generate Barrel', 'fsd-architect.generateBarrel', 'file-zip')
                ]),
                this.createCategory('Generate', [
                    this.createCommandItem('Feature', 'fsd-architect.createFeature', 'new-folder'),
                    this.createCommandItem('Entity', 'fsd-architect.createEntity', 'new-folder'),
                    this.createCommandItem('Widget', 'fsd-architect.createWidget', 'new-folder'),
                    this.createCommandItem('Page', 'fsd-architect.createPage', 'new-folder'),
                    this.createCommandItem('Shared', 'fsd-architect.createShared', 'new-folder')
                ])
            ]);
        }
        
        if (element.contextValue === 'category') {
            return Promise.resolve((element as any).children || []);
        }

        return Promise.resolve([]);
    }

    private createCategory(label: string, children: vscode.TreeItem[]): vscode.TreeItem {
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Expanded);
        item.contextValue = 'category';
        (item as any).children = children;
        return item;
    }

    private createCommandItem(label: string, command: string, iconId: string): vscode.TreeItem {
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        item.command = {
            command: command,
            title: label
        };
        item.iconPath = new vscode.ThemeIcon(iconId);
        item.contextValue = 'command';
        return item;
    }
}
