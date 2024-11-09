// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "docstra" is now active in the web extension host!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("docstra.helloWorld", () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from Docstra in a web extension host!"
      );
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "docstra.chatWindow",
      new ChatViewProvider(context)
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

// ChatViewProvider manages the content in the "chat-window" view
class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;

    // Set the Webview HTML content for the chat UI
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getWebviewContent(view);

    // Listen for messages from the Webview
    view.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "sendMessage":
            const response = await this.fetchChatResponse(message.text);
            view.webview.postMessage({
              command: "displayMessage",
              text: response,
            });
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  // Generates HTML content for the chat window
  private getWebviewContent(view: vscode.WebviewView): string {
    const stylesResetUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );
    const stylesVSCodeUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    );
    const stylesCustomUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css")
    );

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="${stylesResetUri}" type="text/css">
				<link rel="stylesheet" href="${stylesVSCodeUri}" type="text/css">
				<link rel="stylesheet" href="${stylesCustomUri}" type="text/css">
            </head>
            <body>
                <div id="chat-container">
                    <div id="messages"></div>
                    <div id="input">
                        <input type="text" id="messageInput" placeholder="Type a message..." />
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function sendMessage() {
                        const input = document.getElementById("messageInput");
                        const text = input.value;
                        input.value = "";
                        vscode.postMessage({ command: "sendMessage", text: text });
                        displayMessage("You: " + text);
                    }

                    function displayMessage(text) {
                        const messages = document.getElementById("messages");
                        const messageElement = document.createElement("div");
                        messageElement.textContent = text;
                        messages.appendChild(messageElement);
                        messages.scrollTop = messages.scrollHeight;
                    }

                    window.addEventListener("message", event => {
                        const message = event.data;
                        if (message.command === "displayMessage") {
                            displayMessage("Docstra: " + message.text);
                        }
                    });
                </script>
            </body>
            </html>
        `;
  }

  // Simulated async function to fetch a chat response (replace with real API call)
  private async fetchChatResponse(text: string): Promise<string> {
    // Here you could implement a fetch to your FastAPI backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Response to "${text}"`);
      }, 1000);
    });
  }
}
