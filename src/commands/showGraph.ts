import * as vscode from 'vscode';
import { ConfigResolver } from '../core/configResolver';

export function registerShowGraphCommand() {
    return vscode.commands.registerCommand('fsd-architect.showGraph', async () => {
        const configResolver = ConfigResolver.getInstance();
        await configResolver.loadConfig();
        const fsdConfig = configResolver.getFsdConfig();
        
        const layers = fsdConfig.layers;

        // In a full implementation, we'd scan the workspace to find actual dependencies.
        // For the MVP, we will generate the theoretical graph based on the config.
        
        const panel = vscode.window.createWebviewPanel(
            'fsdGraph',
            'FSD Architecture Graph',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        let mermaidCode = 'flowchart TD\n';
        for (let i = layers.length - 1; i > 0; i--) {
            mermaidCode += `    ${layers[i]} --> ${layers[i - 1]}\n`;
        }

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>FSD Graph</title>
                <script type="module">
                    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
                </script>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                </style>
            </head>
            <body>
                <div class="mermaid">
                    ${mermaidCode}
                </div>
            </body>
            </html>
        `;
    });
}
