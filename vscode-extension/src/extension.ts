import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Mentor Satellite is active!');

    let disposable = vscode.commands.registerCommand('ai-code-mentor.openInWeb', () => {
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

        // Encode code for URL
        // Warning: This has URL length limits. Ideal for snippets.
        const encodedCode = encodeURIComponent(text);
        const language = encodeURIComponent(document.languageId);

        // Define base URL (hardcoded for now, could be configurable)
        const baseUrl = 'http://localhost:3000/codigo'; // Or production URL
        const url = `${baseUrl}?code=${encodedCode}&lang=${language}`;

        vscode.env.openExternal(vscode.Uri.parse(url));
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
