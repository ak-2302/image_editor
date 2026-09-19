import type { EditorHistorySnapshot } from "../history/historyTypes";

const STORAGE_KEY = "image-editor-project-v1";

export function loadProject(): EditorHistorySnapshot | null {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as EditorHistorySnapshot;
  } catch {
    return null;
  }
}

export function saveProject(snapshot: EditorHistorySnapshot): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredProject() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // [AI] 保存領域が利用できない環境でも編集自体は継続する。
  }
}
