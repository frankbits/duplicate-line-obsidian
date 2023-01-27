import { Editor, EditorSelectionOrCaret, Plugin } from "obsidian";

/**
 * Plugin to duplicate lines in the editor.
 */
export default class DuplicateLine extends Plugin {
	/**
	 * Register the "duplicate-line" command when the plugin is loaded.
	 */
	async onload() {
		this.addCommand({
			id: "duplicate-line", //old name to not loose shortcut
			name: "Duplicate Line Down",
			editorCallback: (editor) => this.duplicateLine(editor, 0),
		});
		this.addCommand({
			id: "duplicate-line-up",
			name: "Duplicate Line Up",
			editorCallback: (editor) => this.duplicateLine(editor, 1),
		});
	}

	/**
	 * Handle the logic for duplicating the selected lines.
	 *
	 * @param editor - The editor instance.
	 * @param up - Indicates whether to duplicate the line up or down. 0 for down, 1 for up.
	 */
	duplicateLine = (editor: Editor, up: number): void => {
		const cursors = editor.listSelections(); // multicursors
		let addedLines = 0;
		const selections: EditorSelectionOrCaret[] = [];
		let multilineCursorCount = 0;

		for (const cursor of cursors) {
			let lineContent = "";
			let lineNumber = 0;
			const head = cursor.head.line;
			const anchor = cursor.anchor.line;
			const headChar = cursor.head.ch;
			const anchorChar = cursor.anchor.ch;

			if (head === anchor) {
				lineNumber = head + addedLines;
				lineContent = editor.getLine(lineNumber);
				if (!lineContent.trim()) {
					// check if the line is empty
					return;
				}
				addedLines++;
				const lineContent1 = lineContent + "\n" + lineContent;
				editor.replaceRange(
					lineContent1,
					{ line: lineNumber, ch: 0 },
					{ line: lineNumber, ch: lineContent.length }
				);
				if (up) {
					selections.push({
						//selection back
						head: { line: lineNumber, ch: headChar },
						anchor: { line: lineNumber, ch: anchorChar },
					});
				}
			} else {
				multilineCursorCount++;
				let totalContent = "";
				const startLine = Math.min(head, anchor) + addedLines;
				const endLine = Math.max(head, anchor) + addedLines;
				const selectedLines = endLine - startLine;

				for (let i = startLine; i <= endLine; i++) {
					lineContent = editor.getLine(i);
					if (i !== endLine) totalContent += lineContent + "\n";
					else totalContent += lineContent;
				}
				addedLines += selectedLines + 1;

				const lastLineContent = editor.getLine(endLine);
				const lineContent1 = lastLineContent + "\n" + totalContent;
				editor.replaceRange(
					lineContent1,
					{ line: endLine, ch: 0 },
					{ line: endLine, ch: lastLineContent.length }
				);
				// lineNumber = head + addedLines;
				if (up) {
					const offset =
						multilineCursorCount > 1 ? selectedLines + 1 : 0;
					selections.push({
						//selection back
						anchor: { line: anchor + offset, ch: anchorChar },
						head: { line: head + offset, ch: headChar },
					});
				}
			}
			if (!up) {
				selections.push({
					//selection back
					anchor: { line: anchor + addedLines, ch: anchorChar },
					head: { line: head + addedLines, ch: headChar },
				});
			}
		}

		editor.setSelections(selections);
	};
}
