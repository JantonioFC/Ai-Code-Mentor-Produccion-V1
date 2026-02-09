import * as vscode from "vscode";
import { AuthManager } from "../auth/authManager";
import axios from "axios";
import MarkdownIt from "markdown-it";
import { CONFIG } from "../config";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private _chatHistory: { role: string; content: string }[] = [];

    constructor(private readonly _extensionUri: vscode.Uri, private readonly _authManager: AuthManager) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) return;
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) return;
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case "onAsk": {
                    if (!data.value) return;
                    await this.handleUserMessage(data.value);
                    break;
                }
                case "onInsertCode": {
                    if (!data.value) return;
                    await this.insertCodeAtCursor(data.value);
                    break;
                }
                case "onSaveAnalysis": {
                    await this.saveAnalysisToFile();
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private async insertCodeAtCursor(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }

        const selection = editor.selection;
        // If selection is empty, insert at cursor. If not, replace selection.
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, code);
        });
        vscode.window.showInformationMessage('Code inserted successfully.');
    }

    private async saveAnalysisToFile() {
        if (this._chatHistory.length === 0) {
            vscode.window.showWarningMessage('No analysis to save.');
            return;
        }

        // Generate Markdown content
        let fileContent = '# AI Mentor Analysis\n\n';

        // Add timestamp
        fileContent += `Date: ${new Date().toLocaleString()}\n\n`;

        this._chatHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'User' : 'AI Mentor';
            fileContent += `## ${role}\n\n${msg.content}\n\n`;
        });

        // Prompt user for file location
        const options: vscode.SaveDialogOptions = {
            defaultUri: vscode.workspace.workspaceFolders?.[0].uri,
            filters: {
                'Markdown': ['md'],
                'All Files': ['*']
            },
            title: 'Save Analysis'
        };

        const fileUri = await vscode.window.showSaveDialog(options);

        if (fileUri) {
            try {
                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(fileContent, 'utf8'));
                vscode.window.showInformationMessage(`Analysis saved to ${fileUri.fsPath}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to save file: ${error.message}`);
            }
        }
    }

    private async handleUserMessage(message: string) {
        if (!this._view) return;

        // 1. Add User Message to History & UI
        this._chatHistory.push({ role: 'user', content: message });

        // Render markdown for user message too (optional, but good for code snippets in Qs)
        const userHtml = this._formatMarkdown(message);

        this._view.webview.postMessage({ type: 'add-message', value: { role: 'user', html: userHtml } });
        this._view.webview.postMessage({ type: 'set-loading', value: true });

        // -- Command Parsing Logic --
        let processedMessage = message;
        if (message.startsWith('/')) {
            const command = message.split(' ')[0].toLowerCase();
            switch (command) {
                case '/refactor':
                    processedMessage = "Refactor this code to follow best practices (readability, performance, security). Explain your changes.";
                    break;
                case '/fix':
                    processedMessage = "Analyze and fix any potential bugs or errors in this code. Provide the corrected code.";
                    break;
                case '/test':
                    processedMessage = "Generate comprehensive unit tests for this code (Jest/PyTest depending on language).";
                    break;
                case '/docs':
                    processedMessage = "Generate detailed JSDoc/Docstrings for this code, explaining parameters and return values.";
                    break;
                default:
                    // If unknown command, keep as is or maybe show a hint? 
                    // For now, treat as normal message if not matched exactly or just pass through.
                    break;
            }
            // Update the last history item to reflect the expanded prompt?
            // Actually, for the AI context, passing the expanded prompt is better.
            // But for UI history, the user saw "/refactor". 
            // We should send 'processedMessage' to the backend, but keep 'message' in UI. 
            // In _chatHistory, we store what we *want* the AI to see as context.
            // If we store "/refactor", the AI might not know what to do if it wasn't fine-tuned on commands.
            // So we replace the content in _chatHistory with the expanded prompt.
            this._chatHistory[this._chatHistory.length - 1].content = processedMessage;
        }

        try {
            const token = await this._authManager.getToken();
            if (!token) {
                this._view.webview.postMessage({ type: 'error', value: 'Please connect first.' });
                return;
            }

            // 2. Send to Backend
            const response = await axios.post(`${CONFIG.API_BASE_URL}/api/ext/analyze`, {
                code: 'Check history', // Context is in messages
                language: 'markdown', // Default
                intent: 'chat',
                messages: this._chatHistory
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const analysis = response.data.analysis;
            let responseText = '';

            if (typeof analysis === 'object') {
                // If it's structured (feedback/strengths), format it back to Markdown/HTML
                // For chat, we might prefer a string, but if the backend returns JSON, we handle it.
                // Re-using _formatAnalysisObject (logic extracted) would be good, 
                // but for now let's stringify or pick 'feedback'.
                if (analysis.feedback) {
                    responseText = this._formatAnalysisToHtml(analysis);
                } else {
                    responseText = JSON.stringify(analysis);
                }
            } else {
                responseText = this._formatMarkdown(analysis);
            }

            // 3. Add AI Response to History & UI
            // Note: We store raw text in history, but send HTML to UI
            // If response was object, we need a textual representation for history
            const historyContent = typeof analysis === 'object' ? (analysis.feedback || JSON.stringify(analysis)) : analysis;

            this._chatHistory.push({ role: 'model', content: historyContent });

            this._view.webview.postMessage({
                type: 'add-message',
                value: { role: 'model', html: responseText }
            });

        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            this._view.webview.postMessage({ type: 'error', value: errorMessage });
        } finally {
            this._view.webview.postMessage({ type: 'set-loading', value: false });
        }
    }

    public async analyzeCode(code: string, language: string = 'javascript') {
        if (!this._view) {
            await vscode.commands.executeCommand('ai-code-mentor.sidebar.focus');
        } else {
            this._view.show?.(true);
        }

        // Reset History
        this._chatHistory = [];
        this._view?.webview.postMessage({ type: 'clear-chat' });
        this._view?.webview.postMessage({ type: 'set-loading', value: true });

        try {
            const token = await this._authManager.getToken();
            if (!token) {
                this._view?.webview.postMessage({
                    type: 'error',
                    value: 'Please connect to AI Code Mentor first (Run "AI Mentor: Connect").'
                });
                return;
            }

            // Sending initial analysis request
            // We treat this as the "System Prompt" setup or first user message
            // But API expects 'code' for 'explain' intent.
            const response = await axios.post(`${CONFIG.API_BASE_URL}/api/ext/analyze`, {
                code,
                language,
                intent: 'explain'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const analysis = response.data.analysis;
            const htmlContent = this._formatAnalysisToHtml(analysis);

            // Store in history
            // For the history sent to Gemini, we need text.
            const historyText = typeof analysis === 'object' ? analysis.feedback : analysis;

            // We implicitly assume the 'explain' intent sets up the context on the backend 
            // OR we need to add this interaction to our local history.
            // Since our backend 'chat' intent relies on passing full history, 
            // we MUST add this initial exchange to _chatHistory.

            this._chatHistory.push({ role: 'user', content: `Explain this code:\n\`\`\`${language}\n${code}\n\`\`\`` });
            this._chatHistory.push({ role: 'model', content: historyText });

            this._view?.webview.postMessage({
                type: 'add-message',
                value: { role: 'model', html: htmlContent }
            });

        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            this._view?.webview.postMessage({
                type: 'error',
                value: `Error: ${errorMessage}`
            });
        } finally {
            this._view?.webview.postMessage({ type: 'set-loading', value: false });
        }
    }

    private _formatAnalysisToHtml(analysis: any): string {
        let htmlContent = '';
        if (analysis && typeof analysis === 'object') {
            if (analysis.feedback) {
                htmlContent += `<div class="section feedback"><h3>Feedback</h3><p>${this._formatMarkdown(analysis.feedback)}</p></div>`;
            }
            if (analysis.strengths && Array.isArray(analysis.strengths) && analysis.strengths.length > 0) {
                htmlContent += `<div class="section strengths"><h3>Strengths</h3><ul>`;
                analysis.strengths.forEach((item: string) => htmlContent += `<li>${this._formatMarkdown(item)}</li>`);
                htmlContent += `</ul></div>`;
            }
            if (analysis.improvements && Array.isArray(analysis.improvements) && analysis.improvements.length > 0) {
                htmlContent += `<div class="section improvements"><h3>Improvements</h3><ul>`;
                analysis.improvements.forEach((item: string) => htmlContent += `<li>${this._formatMarkdown(item)}</li>`);
                htmlContent += `</ul></div>`;
            }
            if (analysis.examples && Array.isArray(analysis.examples) && analysis.examples.length > 0) {
                htmlContent += `<div class="section examples"><h3>Examples</h3>`;
                analysis.examples.forEach((item: string) => {
                    // Add custom code-block wrapper that includes the "Apply" functionality managed by client-side JS
                    // Actually, _formatMarkdown already wraps code blocks. We need to inject the button.
                    // Let's rely on markdown-it rendering, but we might need a custom renderer or regex injection.
                    // Easiest is to post-process the string.
                    const rendered = this._formatMarkdown(item);
                    htmlContent += `<div class="code-container">${rendered}</div>`;
                });
                htmlContent += `</div>`;
            }
        } else if (typeof analysis === 'string') {
            htmlContent = this._formatMarkdown(analysis);
        } else {
            htmlContent = `<pre>${JSON.stringify(analysis, null, 2)}</pre>`;
        }
        return htmlContent;
    }

    private _escapeHtml(text: string): string {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    private _formatMarkdown(text: string): string {
        if (!text) return '';
        const md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
        return md.render(text);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <style>
                    body { display: flex; flex-direction: column; height: 100vh; padding: 0; overflow: hidden; font-family: var(--vscode-font-family); }
                    
                    /* Toolbar */
                    #toolbar { padding: 5px 10px; border-bottom: 1px solid var(--vscode-widget-border); display: flex; justify-content: flex-end; }
                    .icon-btn { background: none; border: none; color: var(--vscode-icon-foreground); cursor: pointer; padding: 4px; border-radius: 4px; }
                    .icon-btn:hover { background: var(--vscode-toolbar-hoverBackground); }
                    
                    #chat-container { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
                    
                    /* Messages */
                    .message { padding: 8px 12px; border-radius: 6px; max-width: 90%; word-wrap: break-word; }
                    .message.user { align-self: flex-end; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                    .message.user p { margin: 0; }
                    
                    .message.model { align-self: flex-start; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); width: 100%; max-width: 100%; box-sizing: border-box; }
                    
                    /* Markdown Styles */
                    .message.model h3 { margin-top: 10px; border-bottom: 1px solid var(--vscode-widget-border); font-size: 1.1em; }
                    .message.model ul { padding-left: 20px; }
                    .message.model li { margin-bottom: 4px; }
                    
                    /* Code Blocks & container */
                    .code-container { position: relative; margin: 8px 0; }
                    .code-block { background: var(--vscode-textCodeBlock-background); padding: 8px; border-radius: 4px; overflow-x: auto; }
                    pre { margin: 0; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
                    code { font-family: var(--vscode-editor-font-family); background: var(--vscode-textBlockQuote-background); padding: 2px 4px; border-radius: 3px; }
                    pre code { background: none; padding: 0; }
                    
                    /* Apply Button (injected via JS into pre/code blocks) */
                    .apply-btn {
                        position: absolute; top: 5px; right: 5px;
                        background: var(--vscode-button-background); color: var(--vscode-button-foreground);
                        border: none; padding: 2px 8px; border-radius: 3px; font-size: 0.8em; cursor: pointer; opacity: 0.8;
                    }
                    .apply-btn:hover { opacity: 1; }
                    
                    #input-container { padding: 10px; border-top: 1px solid var(--vscode-widget-border); background: var(--vscode-editor-background); display: flex; gap: 8px; }
                    #chat-input { flex: 1; min-height: 40px; max-height: 100px; resize: vertical; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; padding: 5px; font-family: inherit; }
                    #chat-input:focus { outline: 1px solid var(--vscode-focusBorder); }
                    #send-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                    #send-btn:hover { background: var(--vscode-button-hoverBackground); }
                    #send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                    
                    .loading-dots { display: inline-block; }
                    .loading-dots:after { content: '.'; animation: dots 1.5s steps(5, end) infinite; }
                    @keyframes dots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60% { content: '...'; } 80%, 100% { content: ''; } }
                    .error { color: var(--vscode-errorForeground); padding: 10px; text-align: center; }
                </style>
			</head>
			<body>
                <div id="toolbar">
                    <button id="save-btn" class="icon-btn" title="Save Analysis">💾 Save Analysis</button>
                </div>

                <div id="chat-container">
                    <div class="message model">
                        <h3>AI Mentor</h3>
                        <p>Select code and run "AI Mentor: Explain Selection" to start.</p>
                    </div>
                </div>
                
                <div id="input-container">
                    <textarea id="chat-input" placeholder="Ask a follow-up question..." disabled></textarea>
                    <button id="send-btn" disabled>Send</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const chatInput = document.getElementById('chat-input');
                    const sendBtn = document.getElementById('send-btn');
                    const saveBtn = document.getElementById('save-btn');
                    
                    // Auto-resize textarea
                    chatInput.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                    });

                    // Send Message
                    function sendMessage() {
                        const text = chatInput.value.trim();
                        if (!text) return;
                        
                        // Add user message to UI immediately (as HTML for consistency logic, though input is text)
                        // markdown rendering happens in backend response for user now, but local preview is text.
                        // Ideally we render markdown locally too, but text is fine for inputs.
                        // Actually, let's keep it simple: Local echo is text-only (fast), 
                        // then replace or ignore? 
                        // Better: sendMessage sends data, implementation waits for 'add-message'.
                        // I will comment out addMessage in sendMessage to rely on extension response.
                        
                        // Clear input
                        chatInput.value = '';
                        chatInput.style.height = 'auto';
                        
                        // Notify extension
                        vscode.postMessage({ type: 'onAsk', value: text });
                    }

                    sendBtn.addEventListener('click', sendMessage);
                    
                    // Enter to send (Shift+Enter for new line)
                    chatInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });

                    // Save Analysis
                    saveBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'onSaveAnalysis' });
                    });

                    function addMessage(role, htmlOrText) {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = 'message ' + role;
                        
                        if (role === 'user') {
                            // Simple text for local echo (backend can return formatted)
                            // But wait, our logic sends formatted HTML back from handleUserMessage 
                            // via 'add-message' event. So we might get duplicate if we add here AND there.
                            // The previous implementation added it here AND expected an event? 
                            // No, handleUserMessage sends 'add-message' for user too.
                            // So we should NOT add it here locally if we rely on backend echo/conf.
                            // BUT UI feels faster if we add immediately. 
                            // Let's rely on the 'add-message' event from SidebarProvider to ensure consistent Markdown rendering
                            // and avoid duplication. So removing local addMessage call in sendMessage is safer 
                            // IF we change handleUserMessage to send back the user message.
                            // Updated handleUserMessage DOES send user message back. 
                            // So let's NOT add it here in sendMessage.
                            // wait, in the previous code I DID add it locally.
                            // Let's stick to the pattern: local echo for speed? 
                            // No, let's use the event to get nice Markdown.
                            // So I will comment out addMessage in sendMessage to rely on extension response.
                            
                            // actually, let's just render the HTML provided
                             msgDiv.innerHTML = htmlOrText;
                        } else {
                            msgDiv.innerHTML = htmlOrText;
                            // Inject Apply Buttons to code blocks
                            injectApplyButtons(msgDiv);
                        }
                        chatContainer.appendChild(msgDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    
                    function injectApplyButtons(container) {
                        const preBlocks = container.querySelectorAll('pre');
                        preBlocks.forEach(pre => {
                            // Check if it already has a button
                            if (pre.querySelector('.apply-btn')) return;
                            
                            // Wrap pre in relative container if not already (our CSS handles .code-container but raw markdown-it output is just pre code)
                            // markdown-it default: <pre><code class="language-js">...</code></pre>
                            // We need a wrapper position relative.
                            // Let's wrap it dynamically.
                            const wrapper = document.createElement('div');
                            wrapper.style.position = 'relative';
                            pre.parentNode.insertBefore(wrapper, pre);
                            wrapper.appendChild(pre);
                            
                            const btn = document.createElement('button');
                            btn.className = 'apply-btn';
                            btn.textContent = 'Apply';
                            btn.title = 'Insert code at cursor';
                            btn.onclick = () => {
                                const code = pre.querySelector('code').innerText;
                                vscode.postMessage({ type: 'onInsertCode', value: code });
                            };
                            
                            wrapper.appendChild(btn);
                        });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'clear-chat':
                                chatContainer.innerHTML = '';
                                break;
                            case 'add-message':
                                addMessage(message.value.role, message.value.html);
                                chatInput.disabled = false;
                                sendBtn.disabled = false;
                                break;
                            case 'set-loading':
                                if (message.value) {
                                    const loadingDiv = document.createElement('div');
                                    loadingDiv.id = 'loading-indicator';
                                    loadingDiv.className = 'message model';
                                    loadingDiv.innerHTML = '<span class="loading-dots">Analyzing</span>';
                                    chatContainer.appendChild(loadingDiv);
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                    chatInput.disabled = true;
                                    sendBtn.disabled = true;
                                } else {
                                    const loadingDiv = document.getElementById('loading-indicator');
                                    if (loadingDiv) loadingDiv.remove();
                                    chatInput.disabled = false;
                                    sendBtn.disabled = false;
                                    chatInput.focus();
                                }
                                break;
                            case 'error':
                                const errDiv = document.createElement('div');
                                errDiv.className = 'error';
                                errDiv.textContent = message.value;
                                chatContainer.appendChild(errDiv);
                                break;
                        }
                    });
                </script>
			</body>
			</html>`;
    }
}
