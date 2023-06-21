import {
	Editor,
	EditorChange,
	EditorPosition,
	EditorRange,
	EditorSelection,
	EditorTransaction,
	Plugin,
} from "obsidian";
import { sortBy } from "lodash";

enum Direction {
	Up,
	Down,
}

/**
 * Plugin to duplicate lines in the editor.
 */
export default class DuplicateLine extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line", //old name to not loose shortcut
			name: "Duplicate Line Down",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.Down),
		});
		this.addCommand({
			id: "duplicate-line-up",
			name: "Duplicate Line Up",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.Up),
		});
	}

	duplicateLine = (editor: Editor, direction: Direction): void => {
		const selections = editor.listSelections();
		let addedLines = 0;
		const changes: EditorChange[] = [];
		const newSelectionRanges: EditorRange[] = [];

		for (let selection of selections) {
			const newSelection = this.selectionToLine(editor, selection);
			const rangeLine = this.selectionToRange(newSelection); //already sorted
			const numberOfLines = rangeLine.to.line - rangeLine.from.line + 1;
			const content = editor.getRange(rangeLine.from, rangeLine.to);
			if (!content.trim()) continue;

			let change: EditorChange;
			let newAnchor: EditorPosition;
			let newHead: EditorPosition;

			switch (direction) {
				case Direction.Down:
					addedLines += numberOfLines;
					newAnchor = {
						line: selection.anchor.line + addedLines,
						ch: selection.anchor.ch,
					};
					newHead = {
						line: selection.head.line + addedLines,
						ch: selection.head.ch,
					};

					{
						change = {
							from: rangeLine.to,
							to: rangeLine.to,
							text: "\n" + content,
						};
					}
					break;

				case Direction.Up:
					newAnchor = {
						line: selection.anchor.line + addedLines,
						ch: selection.anchor.ch,
					};
					newHead = {
						line: selection.head.line + addedLines,
						ch: selection.head.ch,
					};

					addedLines += numberOfLines;
					{
						change = {
							from: rangeLine.from,
							to: rangeLine.from,
							text: content + "\n",
						};
					}
					break;
			}

			newSelectionRanges.push(
				this.selectionToRange({
					anchor: newAnchor,
					head: newHead,
				})
			);

			changes.push(change);
		}

		if (changes.length > 0) {
			const transaction: EditorTransaction = {
				changes: changes,
				selections: newSelectionRanges,
			};

			const origin = "DirectionalCopy_" + String(direction);
			editor.transaction(transaction, origin);
		}
	};

	selectionToRange(selection: EditorSelection, sort?: boolean): EditorRange {
		const positions = [selection.anchor, selection.head];
		let sorted = positions;
		if (sort) {
			sorted = sortBy(positions, ["line", "ch"]);
		}
		return {
			from: sorted[0],
			to: sorted[1],
		};
	}

	selectionToLine(
		editor: Editor,
		selection: EditorSelection
	): EditorSelection {
		const range = this.selectionToRange(selection, true); // {from:{line: 11, ch: 0} to:{line: 12...
		const toLength = editor.getLine(range.to.line).length; // len line 12
		const newSelection: EditorSelection = {
			anchor: { line: range.from.line, ch: 0 },
			head: { line: range.to.line, ch: toLength },
		};

		return newSelection;
	}
}
