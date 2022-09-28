import { MarkdownView, Plugin } from "obsidian";

export default class WindowCollapse extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line",
			name: "Duplicate Line",
			callback: () => this.duplicateLine(),
		});
	}

	duplicateLine() {
		const markdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView);

		if (!markdownView) return;

		const editor = markdownView.editor;
		let { line: lineNumber, ch: column } = editor.getCursor();

		const lineContent = editor.getLine(lineNumber);

		// if (!lineContent) { //not duplicate empty line?, more intuitive to let do it...
		// 	return;
		// }

		const LineEndCh = lineContent.length;
		const lastLine = editor.lastLine();
		console.log(LineEndCh, lastLine);
		const lineContent1 = lineContent + "\n" + lineContent;
		editor.setLine(lineNumber, lineContent1);
		lineNumber++;
		editor.setCursor(lineNumber, LineEndCh);
	}
}
