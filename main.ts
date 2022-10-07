import { Plugin } from "obsidian";

export default class WindowCollapse extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line",
			name: "Duplicate Line",
			editorCallback: (editor) => this.duplicateLine(editor),
		});
		this.addCommand({
			id: "arrow-down",
			name: "Arrow Down",
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "ArrowDown" }],
			editorCallback: (editor) => {
				this.arrows(editor, "↓");
			},
		});
		this.addCommand({
			id: "arrow-up",
			name: "Arrow Up",
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "ArrowUp" }],
			editorCallback: (editor) => {
				this.arrows(editor, "↑");
			},
		});
		this.addCommand({
			id: "arrow-left",
			name: "Arrow Left",
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "ArrowLeft" }],
			editorCallback: (editor) => {
				this.arrows(editor, "←");
			},
		});
		this.addCommand({
			id: "arrow-right",
			name: "Arrow Right",
			hotkeys: [{ modifiers: ["Mod", "Alt"], key: "ArrowRight" }],
			editorCallback: (editor) => {
				this.arrows(editor, "→");
			},
		});
	}

	arrows(editor, arrow) {
		const { line: lineNumber, ch: column } = editor.getCursor();
		const lineContent = editor.getLine(lineNumber);
		const content0 = lineContent.slice(0, column);
		const content1 = lineContent.slice(column, lineContent.length);
		const newLineContent = content0 + arrow + content1;
		editor.setLine(lineNumber, newLineContent);
		editor.setCursor(lineNumber + 1, column + 1);
	}

	duplicateLine(editor) {
		// const markdownView =
		// 	this.app.workspace.getActiveViewOfType(MarkdownView);

		// if (!markdownView) return;

		// const editor = markdownView.editor;
		const { line: lineNumber, ch: column } = editor.getCursor();
		const lineContent = editor.getLine(lineNumber);
		if (!lineContent) {
			return;
		}
		const LineEndCh = lineContent.length;
		const lastLine = editor.lastLine();
		console.log(LineEndCh, lastLine);
		const lineContent1 = lineContent + "\n" + lineContent;
		editor.setLine(lineNumber, lineContent1);
		editor.setCursor(lineNumber + 1, LineEndCh);
	}
}
