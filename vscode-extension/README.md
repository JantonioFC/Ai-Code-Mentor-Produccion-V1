# AI Code Mentor Satellite - VS Code Extension

This is the official "Satellite" extension for **AI Code Mentor**, designed to bridge your local development environment with the web platform.

## Features

*   **Open in Web**: Select any code snippet in your editor and instantly open it in the AI Code Mentor web platform for analysis.
*   **Context Preservation**: Automatically detecting language and context.

## Installation & Development

This extension is currently in **Developer Preview**. To run it:

1.  **Prerequisites**:
    *   Node.js & npm installed.
    *   VS Code installed.

2.  **Setup**:
    ```bash
    cd vscode-extension
    npm install
    ```

3.  **Run in Debug Mode**:
    *   Open this folder (`vscode-extension`) in VS Code.
    *   Press **F5** to launch a new "Extension Development Host" window.
    *   In the new window, select some code.
    *   Open Command Palette (`Ctrl+Shift+P`) and run: `AI Mentor: Ask for Help`.

4.  **Build .vsix (Optional)**:
    *   Install `vsce`: `npm install -g @vscode/vsce`
    *   Package: `vsce package`
    *   Install the resulting `.vsix` file in your main VS Code instance.

## Philosophy

We believe the "Brain" should be centralized (Web Platform) while the "Eyes" can be everywhere (VS Code, CLI). This extension is lightweight by design, deferring heavy AI processing to the optimized web platform.
