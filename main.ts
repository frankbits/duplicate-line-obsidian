import {
	Editor,
	EditorChange,
	EditorRange,
	EditorSelection,
	EditorTransaction,
	Plugin,
} from "obsidian";
import { sortBy } from "lodash";

enum Direction {
	Up,
	Down,
	Left,
	Right,
}

/**
 * Plugin to duplicate lines in the editor.
 */
export default class DuplicateLine extends Plugin {
	async onload() {
		this.addCommand({
			id: "duplicate-line",
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
		this.addCommand({
			id: "duplicate-line-left",
			name: "Duplicate Line Left",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.Left),
		});
		this.addCommand({
			id: "duplicate-line-right",
			name: "Duplicate Line Right",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.Right),
		});
	}

	duplicateLine = (editor: Editor, direction: Direction): void => {
		const selections = editor.listSelections();
		let addedLines = 0;
		const changes: EditorChange[] = [];
		const newSelectionRanges: EditorRange[] = [];

		for (let selection of selections) {
			const newSelection = this.selectionToLine(
				editor,
				selection,
				direction
			);
			const rangeLine = this.selectionToRange(newSelection); //already sorted
			const numberOfLines = rangeLine.to.line - rangeLine.from.line + 1;
			const content = editor.getRange(rangeLine.from, rangeLine.to);
			if (!content.trim()) continue;

			let change: EditorChange;
			let newAnchor = {
				line: 0,
				ch: 0,
			};
			let newHead = {
				line: 0,
				ch: 0,
			};

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

				case Direction.Left: {
					newAnchor = {
						line: selection.anchor.line,
						ch: selection.anchor.ch,
					};
					newHead = {
						line: selection.head.line,
						ch: selection.head.ch,
					};
					change = {
						from: rangeLine.from,
						to: rangeLine.from,
						text: content,
					};
					break;
				}

				case Direction.Right: {
					newAnchor = {
						line: selection.anchor.line,
						ch: selection.anchor.ch+content.length,
					};
					newHead = {
						line: selection.head.line,
						ch: selection.head.ch + content.length,
					};
					change = {
						from: rangeLine.to,
						to: rangeLine.to,
						text: content,
					};
					break;
				}
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
		selection: EditorSelection,
		direction: Direction
	): EditorSelection {
		const range = this.selectionToRange(selection, true); // {from:{line: 11, ch: 0} to:{line: 12...
		const vertical: boolean =
			direction === Direction.Up || direction === Direction.Down;
		if (vertical) {
			const toLength = editor.getLine(range.to.line).length; // len line 12
			const newSelection: EditorSelection = {
				anchor: { line: range.from.line, ch: 0 },
				head: { line: range.to.line, ch: toLength },
			};
			return newSelection;
		} else {
			return selection;
		}
	}
}
