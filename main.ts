import { Plugin } from "obsidian";

export default class WindowCollapse extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line",
			name: "Duplicate Line",
			editorCallback: (editor) => this.duplicateLine(editor),
		});
	}

	duplicateLine(editor) {
		const { line: lineNumber, ch: column } = editor.getCursor();
		const lineContent = editor.getLine(lineNumber);
		if (!lineContent) {
			return;
		}
		const lineContent1 = lineContent + "\n" + lineContent;
		editor.replaceRange(
			lineContent1,
			{ line: lineNumber, ch: 0 },
			{ line: lineNumber, ch: lineContent.length }
		);
		editor.setCursor(lineNumber + 1, lineContent.length);
	}
}
