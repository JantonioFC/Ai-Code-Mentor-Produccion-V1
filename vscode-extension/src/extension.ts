import * as vscode from 'vscode';
import { AuthManager } from './auth/authManager';
import { SidebarProvider } from './sidebar/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Mentor Satellite is active!');

    const authManager = new AuthManager(context);
    const sidebarProvider = new SidebarProvider(context.extensionUri, authManager);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "ai-code-mentor.sidebar",
            sidebarProvider
        )
    );

    // Command: Connect
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-code-mentor.connect', async () => {
            await authManager.login();
        })
    );

    // Command: Disconnect
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-code-mentor.disconnect', async () => {
            await authManager.logout();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("ai-code-mentor.explain", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("Por favor selecciona código en un editor abierto.");
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (!text) {
                vscode.window.showInformationMessage("No hay código seleccionado.");
                return;
            }

            // Focus sidebar
            await vscode.commands.executeCommand("ai-code-mentor.sidebar.focus");

            // Trigger analysis
            // Pasamos el lenguaje del documento también
            sidebarProvider.analyzeCode(text, editor.document.languageId);
        })
    );

    // Command: Open in Web (Old) - Kept for reference/utility
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-code-mentor.openInWeb', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No code selected!');
                return;
            }

            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);

            if (!text) {
                vscode.window.showInformationMessage('Please select some code first.');
                return;
            }

            const encodedCode = encodeURIComponent(text);
            const language = encodeURIComponent(document.languageId);

            // TODO: Use config if needed
            const baseUrl = 'http://localhost:3000/codigo';
            const url = `${baseUrl}?code=${encodedCode}&lang=${language}`;

            vscode.env.openExternal(vscode.Uri.parse(url));
        })
    );
}

export function deactivate() { }
