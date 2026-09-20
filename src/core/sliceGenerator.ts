import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function createFsdSlice(layer: string, arg?: any) {
    let targetPath = '';
    
    // Check if arg is a Uri (from context menu)
    if (arg && arg.fsPath) {
        targetPath = arg.fsPath;
    } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened.');
            return;
        }
        
        targetPath = workspaceFolders[0].uri.fsPath;
        
        // If they clicked from the sidebar, try to find a 'src' folder intelligently
        const srcPath = path.join(targetPath, 'src');
        if (fs.existsSync(srcPath)) {
            targetPath = srcPath;
        }
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
        targetPath = path.dirname(targetPath);
    }

    // Usually, slices live in `src/<layer>/<sliceName>`
    // If targetPath is not already `src/<layer>`, we might want to prompt or assume they are right-clicking the layer folder.
    // Let's just ask for the slice name.
    
    const sliceName = await vscode.window.showInputBox({
        prompt: `Enter name for the new ${layer} slice`,
        placeHolder: `e.g. auth, userProfile, etc.`
    });

    if (!sliceName) {
        return; // Cancelled
    }

    // Determine actual target directory for the new slice
    // If they clicked directly on the `features` folder, we just append sliceName.
    // If they clicked on `src`, we append `features/sliceName`.
    let sliceDir = path.join(targetPath, sliceName);
    
    if (!targetPath.endsWith(layer) && !targetPath.includes(layer)) {
        sliceDir = path.join(targetPath, layer, sliceName);
    }

    if (fs.existsSync(sliceDir)) {
        vscode.window.showErrorMessage(`Slice '${sliceName}' already exists at ${sliceDir}`);
        return;
    }

    // Ask what folders to create
    const foldersToCreate = await vscode.window.showQuickPick(
        [
            { label: 'ui', picked: true },
            { label: 'model', picked: true },
            { label: 'api', picked: true },
            { label: 'lib', picked: true },
        ],
        { canPickMany: true, placeHolder: 'Select internal segments to create' }
    );

    if (!foldersToCreate) {
        return; // User cancelled
    }

    fs.mkdirSync(sliceDir, { recursive: true });

    for (const item of foldersToCreate) {
        fs.mkdirSync(path.join(sliceDir, item.label));
    }

    // Create index.ts (Public API)
    const indexFile = path.join(sliceDir, 'index.ts');
    fs.writeFileSync(indexFile, '// Public API\n');

    vscode.window.showInformationMessage(`Created ${layer} slice '${sliceName}' successfully.`);
}
