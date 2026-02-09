# AI Code Mentor Satellite - VS Code Extension

This is the official "Satellite" extension for **AI Code Mentor**, designed to bridge your local development environment with the web platform.

## Features

### 🚀 Core
*   **AI Mentor: Explain Selection**: Select any code snippet and get an instant AI-powered explanation with feedback, strengths, and improvements.

### 💬 Interactive Chat
*   **Conversational Interface**: Ask follow-up questions to the AI about your code (e.g., "How can I fix this error?").
*   **Slash Commands**: Use shortcuts for common tasks:
    *   `/refactor`: Refactor code for best practices.
    *   `/fix`: Analyze and fix bugs.
    *   `/test`: Generate unit tests.
    *   `/docs`: Generate documentation (JSDoc/Docstrings).

### 🛠️ Productivity
*   **Apply Fix**: Insert generated code directly into your editor with a single click.
*   **Save Analysis**: Export your conversation and analysis to a Markdown file (`.md`) for future reference.

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
    *   Select code and run command: `AI Mentor: Explain Selection`.

4.  **Build .vsix (Optional)**:
    *   Install `vsce`: `npm install -g @vscode/vsce`
    *   Package: `vsce package`
    *   Install the resulting `.vsix` file in your main VS Code instance.

## Philosophy

We believe the "Brain" should be centralized (Web Platform) while the "Eyes" can be everywhere (VS Code, CLI). This extension is lightweight by design, deferring heavy AI processing to the optimized web platform.
