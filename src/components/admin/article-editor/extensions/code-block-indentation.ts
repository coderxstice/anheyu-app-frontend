import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/** Apply indentation only within the selected code block, using its own settings. */
export function indentCodeBlock(editor: Editor, nodeName: string, reverse = false): boolean {
  const { state, view } = editor;
  const { selection } = state;
  const { $from, $to, from, to, empty } = selection;
  if (!(selection instanceof TextSelection) || $from.parent.type.name !== nodeName || !$from.sameParent($to)) {
    return false;
  }

  const width = [2, 4, 8].includes(Number($from.parent.attrs.indentWidth))
    ? Number($from.parent.attrs.indentWidth)
    : 2;
  const indent = $from.parent.attrs.indentMode === "tab" ? "\t" : " ".repeat(width);
  const tr = state.tr;
  if (empty && !reverse) {
    view.dispatch(tr.insertText(indent, from, to).scrollIntoView());
    return true;
  }

  const start = $from.start();
  const text = $from.parent.textContent;
  const firstLine = from === start ? 0 : text.lastIndexOf("\n", from - start - 1) + 1;
  // A selection ending at the next line's start does not include that line.
  const lastOffset = empty ? to - start : Math.max(from - start, to - start - 1);
  const edits: { position: number; remove: number }[] = [];
  let offset = firstLine;
  while (offset <= lastOffset) {
    const line = text.slice(offset);
    const remove = line.startsWith("\t") ? 1 : Math.min(line.match(/^ */)?.[0].length ?? 0, width);
    if (!reverse || remove > 0) edits.push({ position: start + offset, remove });
    const newline = text.indexOf("\n", offset);
    if (newline < 0) break;
    offset = newline + 1;
  }
  for (const edit of edits.reverse()) {
    if (reverse) tr.delete(edit.position, edit.position + edit.remove);
    else tr.insertText(indent, edit.position);
  }
  tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(selection.anchor), tr.mapping.map(selection.head)));
  view.dispatch(tr.scrollIntoView());
  return true;
}
