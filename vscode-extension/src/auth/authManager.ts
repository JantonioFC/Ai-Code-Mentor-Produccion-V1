import * as vscode from 'vscode';
import axios from 'axios';
import { CONFIG } from '../config';

interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
}

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    error?: string;
}

export class AuthManager {
    private secretStorage: vscode.SecretStorage;
    private statusBarItem: vscode.StatusBarItem;
    private pollInterval: NodeJS.Timeout | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBarItem.command = 'ai-code-mentor.connect';
        context.subscriptions.push(this.statusBarItem);

        this.checkStatus();
    }

    private async checkStatus() {
        const token = await this.getToken();
        if (token) {
            this.statusBarItem.text = '$(check) AI Mentor: Connected';
            this.statusBarItem.tooltip = 'Connected to AI Code Mentor';
            this.statusBarItem.command = 'ai-code-mentor.disconnect'; // Change command to allow disconnect
            this.statusBarItem.show();
        } else {
            this.statusBarItem.text = '$(plug) AI Mentor: Connect';
            this.statusBarItem.tooltip = 'Connect to AI Code Mentor';
            this.statusBarItem.command = 'ai-code-mentor.connect';
            this.statusBarItem.show();
        }
    }

    async getToken(): Promise<string | undefined> {
        return await this.secretStorage.get(CONFIG.TOKEN_KEY);
    }

    async login() {
        try {
            // 1. Request Device Code
            const response = await axios.post<DeviceCodeResponse>(`${CONFIG.API_BASE_URL}/api/auth/device/code`);
            const { device_code, user_code, verification_uri_complete, interval } = response.data;

            // 2. Show User Code and Prompt
            const action = await vscode.window.showInformationMessage(
                `AI Mentor Auth: Your code is ${user_code}. Click below to authorize.`,
                'Authorize Now',
                'Copy Code'
            );

            if (action === 'Copy Code') {
                await vscode.env.clipboard.writeText(user_code);
                vscode.window.showInformationMessage('Code copied to clipboard!');
            }

            // Always open the URL (or offer to)
            if (action === 'Authorize Now' || action === 'Copy Code') { // Or just auto-open? Let's auto-open if they click Authorize
                vscode.env.openExternal(vscode.Uri.parse(`${CONFIG.API_BASE_URL}${verification_uri_complete}`));
            } else {
                // If they verify manually or closed the modal, we still poll?
                // Let's create a more persistent notification or just start polling.
                // We will poll regardless.
            }

            // 3. Poll for Token
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Waiting for authorization...",
                cancellable: true
            }, async (progress, token) => {
                return this.pollForToken(device_code, interval, token);
            });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Login failed: ${error.message}`);
        }
    }

    private async pollForToken(deviceCode: string, intervalSeconds: number, cancellationToken: vscode.CancellationToken): Promise<void> {
        const intervalMs = intervalSeconds * 1000;

        return new Promise<void>((resolve, reject) => {
            const timer = setInterval(async () => {
                if (cancellationToken.isCancellationRequested) {
                    clearInterval(timer);
                    resolve();
                    return;
                }

                try {
                    const response = await axios.post<TokenResponse>(`${CONFIG.API_BASE_URL}/api/auth/device/token`, {
                        device_code: deviceCode
                    });

                    const data = response.data;

                    if (data.access_token) {
                        clearInterval(timer);
                        await this.secretStorage.store(CONFIG.TOKEN_KEY, data.access_token);
                        await this.checkStatus();
                        vscode.window.showInformationMessage('Successfully connected to AI Code Mentor!');
                        resolve();
                    } else if (data.error === 'authorization_pending') {
                        // Continue polling
                    } else if (data.error === 'expired_token') {
                        clearInterval(timer);
                        vscode.window.showErrorMessage('Authorization request expired. Please try again.');
                        resolve(); // Or reject
                    } else {
                        // Unknown error
                        clearInterval(timer);
                        vscode.window.showErrorMessage(`Authorization failed: ${data.error}`);
                        resolve();
                    }

                } catch (error: any) {
                    // Start polling even if 400 (authorization_pending might come as 400 depending on backend impl, 
                    // but our Next.js handler returns 400 for errors. Axios throws on 400 by default)
                    if (axios.isAxiosError(error) && error.response?.data?.error === 'authorization_pending') {
                        // This is fine, continue
                    } else {
                        // Real error
                        // console.error(error); 
                        // Just retry a few times? or fail? 
                        // For now we continue unless it's a fatal error
                    }
                }

            }, intervalMs);
        });
    }

    async logout() {
        await this.secretStorage.delete(CONFIG.TOKEN_KEY);
        await this.checkStatus();
        vscode.window.showInformationMessage('Disconnected from AI Code Mentor.');
    }
}
