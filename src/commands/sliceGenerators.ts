import * as vscode from 'vscode';
import { createFsdSlice } from '../core/sliceGenerator';

export function registerSliceGenerators() {
    return [
        vscode.commands.registerCommand('fsd-architect.createFeature', (arg: any) => createFsdSlice('features', arg)),
        vscode.commands.registerCommand('fsd-architect.createEntity', (arg: any) => createFsdSlice('entities', arg)),
        vscode.commands.registerCommand('fsd-architect.createWidget', (arg: any) => createFsdSlice('widgets', arg)),
        vscode.commands.registerCommand('fsd-architect.createPage', (arg: any) => createFsdSlice('pages', arg)),
        vscode.commands.registerCommand('fsd-architect.createShared', (arg: any) => createFsdSlice('shared', arg))
    ];
}
