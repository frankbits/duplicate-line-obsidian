import {
	App,
	Editor,
	EditorChange,
	EditorRange,
	EditorSelection,
	EditorTransaction,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { sortBy } from "lodash";

enum Direction {
	Up,
	Down,
	SelDown,
	SelUp,
	Left,
	Right,
}

interface dupliSettings {
	addSpaceBetween: boolean;
}

const DEFAULT_SETTINGS: dupliSettings = {
	addSpaceBetween: true,
};

export default class DuplicateLine extends Plugin {
	settings: dupliSettings
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DuplicateLineSettings(this.app, this));

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
			id: "duplicate-selection-down",
			name: "Duplicate Selection Down",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.SelDown),
		});
		this.addCommand({
			id: "duplicate-selection-up",
			name: "Duplicate Selection Up",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.SelUp),
		});
		this.addCommand({
			id: "duplicate-line-right",
			name: "Duplicate Line Right",
			editorCallback: (editor) =>
				this.duplicateLine(editor, Direction.Right),
		});
		// useless
		// this.addCommand({ 
		// 	id: "duplicate-line-left",
		// 	name: "Duplicate Line Left",
		// 	editorCallback: (editor) =>
		// 		this.duplicateLine(editor, Direction.Left),
		// });
	}

	async loadSettings() {
		this.settings = {
			... await this.loadData(),
			DEFAULT_SETTINGS
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
			console.debug("newSelection", newSelection)
			const rangeLine = this.selectionToRange(newSelection, true); //already sorted
			console.debug("rangeLine", rangeLine)
			const numberOfLines = rangeLine.to.line - rangeLine.from.line + 1;
			let content = editor.getRange(rangeLine.from, rangeLine.to);
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
					if (this.settings.addSpaceBetween) content = content + " "
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
					if (this.settings.addSpaceBetween) content = " " + content
					newAnchor = {
						line: selection.anchor.line,
						ch: selection.anchor.ch + content.length,
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
				case Direction.SelDown: {
					addedLines += numberOfLines;
					const toLength = editor.getLine(rangeLine.to.line).length
					const NewrangeLineTo = { line: rangeLine.to.line, ch: toLength }
					const condition = this.areObjectsEqual(selection.head, rangeLine.to)

					newAnchor = {
						line: selection.anchor.line + addedLines,
						ch: condition ?
							0 : Math.abs(selection.anchor.ch - selection.head.ch)
					};

					newHead = {
						line: selection.head.line + addedLines,
						ch: condition ?
							Math.abs(selection.anchor.ch - selection.head.ch) : 0,
					};

					{
						change = {
							from: NewrangeLineTo,
							to: NewrangeLineTo,
							text: "\n" + content,
						};
					}

					break;
				}
				case Direction.SelUp: {
					addedLines += numberOfLines;
					const condition = this.areObjectsEqual(selection.head, rangeLine.to)
					const NewrangeLineFrom = { line: rangeLine.from.line, ch: 0 }
					newAnchor = {
						line: selection.anchor.line + addedLines-1,
						ch: condition ? 0 : Math.abs(selection.anchor.ch - selection.head.ch),
					};
					newHead = {
						line: selection.head.line + addedLines-1,
						ch: condition ? Math.abs(selection.anchor.ch - selection.head.ch) : 0,
					};
					// newAnchor = {
					// 	line: selection.anchor.line + addedLines,
					// 	ch: selection.anchor.ch,
					// };
					// newHead = {
					// 	line: selection.head.line + addedLines,
					// 	ch: selection.head.ch,
					// };

					{
						change = {
							from: NewrangeLineFrom,
							to: NewrangeLineFrom,
							text: content + "\n",
						};
					}
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

	areObjectsEqual(obj1: any, obj2: any) {
		return obj1.line === obj2.line && obj1.ch === obj2.ch;
	}

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
		} else if (direction === Direction.SelDown) {
			return selection;
		}
		else {
			// no selection (testing word before cursor)
			if (range.from.line === range.to.line && range.from.ch === range.to.ch) {
				const line = range.from.line
				const ch = range.from.ch
				if (ch > 0) {
					const currentLine = editor.getLine(line)
					// find previous word (thks GPT)
					let startOfWord = ch - 1;
					while (startOfWord >= 0 && /\S/.test(currentLine[startOfWord])) {
						startOfWord--;
					}
					startOfWord++;
					// extract previous word
					const contentLength = currentLine.slice(startOfWord, ch).length;
					const newSelection: EditorSelection = {
						anchor: { line: line, ch: (ch - contentLength) },
						head: { line: line, ch: (ch) },
					};
					return newSelection
				}

			}
			return {
				anchor: editor.getCursor("from"),
				head: editor.getCursor("to"),
			};
		}
	}
}

class DuplicateLineSettings extends PluginSettingTab {
	constructor(app: App, public plugin: DuplicateLine) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Duplicate Line' });

		new Setting(containerEl)
			.setName("Add a space before right duplication")
			.setDesc("eg: 'xyz xyz, to avoid to have to insert a space")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addSpaceBetween)
					.onChange((value) => {
						this.plugin.settings.addSpaceBetween = value;
						this.plugin.saveSettings();
					})
			});
	}
}