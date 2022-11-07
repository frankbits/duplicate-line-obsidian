import { Editor, EditorSelectionOrCaret, Plugin } from "obsidian";

export default class WindowCollapse extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line",
			name: "Duplicate Line",
			editorCallback: (editor) => this.duplicateLine(editor),
		});
	}
	duplicateLine(editor: Editor) {
		const cursors = editor.listSelections(); //multicursors
		let addedLines = 0;
		const selections: EditorSelectionOrCaret[] = [];
		cursors.forEach((cursor) => {
			let lineContent = "";
			let lineNumber = 0;
			const head = cursor.head.line;
			const anchor = cursor.anchor.line;
			const headChar = cursor.head.ch;
			const anchorChar = cursor.anchor.ch;
			if (head == anchor) {
				lineNumber = head + addedLines;
				lineContent = editor.getLine(lineNumber);
				if (!lineContent) {
					return;
				}
				addedLines++;
				const lineContent1 = lineContent + "\n" + lineContent;
				editor.replaceRange(
					lineContent1,
					{ line: lineNumber, ch: 0 },
					{ line: lineNumber, ch: lineContent.length }
				);
			} else {
				let totalContent = "";
				const lastLine = Math.max(head, anchor) + addedLines;
				const firstLine = Math.min(head, anchor) + addedLines;
				const linesRange = Math.abs(head - anchor);

				for (let i = 0; i <= linesRange; i++) {
					const activeLine = firstLine + i;
					lineContent = editor.getLine(activeLine);
					if (i !== linesRange) totalContent += lineContent + "\n";
					else totalContent += lineContent;
				}
				addedLines += linesRange + 1;

				const lastLineContent = editor.getLine(lastLine);

				const lineContent1 = lastLineContent + "\n" + totalContent;
				editor.replaceRange(
					lineContent1,
					{ line: lastLine, ch: 0 },
					{ line: lastLine, ch: lastLineContent.length }
				);
			}
			//to set selection back
			selections.push({
				anchor: { line: anchor + addedLines, ch: anchorChar },
				head: { line: head + addedLines, ch: headChar },
			});
		});
		editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 });//deselect all
		editor.setSelections(selections);
	}
}

