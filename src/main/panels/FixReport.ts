import * as vscode from "vscode";
import {getNonce} from "../libs/getNonce";
import {URI, Utils} from 'vscode-uri';
import { Flow } from "lightningflowscan-core/out/main/models/Flow";

export class FixReport {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: FixReport | undefined;

    public static readonly viewType = "report";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri , flow : any) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (FixReport.currentPanel) {
            FixReport.currentPanel._panel.reveal(column);
            FixReport.currentPanel._update(flow);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            FixReport.viewType,
            `Fix:${flow.label}`,
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    Utils.joinPath(extensionUri, "media"),
                    Utils.joinPath(extensionUri, "out/compiled")
                ]
            }
        );
        FixReport.currentPanel = new FixReport(panel, extensionUri, flow);
    }

    public static kill() {
        FixReport.currentPanel?.dispose();
        FixReport.currentPanel = undefined;
    }

    // public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    //     FixReport.currentPanel = new FixReport(panel, extensionUri);
    // }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, flow : any) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(flow);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //   (message) => {
        //     switch (message.command) {
        //       case "alert":
        //         vscode.window.showErrorMessage(message.text);
        //         return;
        //     }
        //   },
        //   null,
        //   this._disposables
        // );
    }

    public dispose() {
        FixReport.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update(flow : Flow) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'init-view': {
                //added this route
                    webview.postMessage({
                        type: 'init',
                        flow: flow
                    });
                    return;
                }
                // case "tokens": {
                //     await Util.globalState.update(accessTokenKey, data.accessToken);
                //     await Util.globalState.update(refreshTokenKey, data.refreshToken);
                //     break;
                // }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            Utils.joinPath(this._extensionUri, "out/compiled", "FixReport.js")
        );

        // vscode css reset
        const stylesResetUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        ));
        // vscode recommended css
        const stylesMainUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        ));

        const cssUri = webview.asWebviewUri(Utils.joinPath(
            this._extensionUri,
            "media",
            "FixReport.css"
        ));

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <link href="${cssUri}" rel="stylesheet">
        <script nonce="${nonce}">
        const tsvscode = acquireVsCodeApi();
        </script>
			</head>
      <body>
            <script src="${scriptUri}" nonce="${nonce}"></script>
			</body>
			</html>`;
    }

}
