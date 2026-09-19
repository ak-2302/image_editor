import type { EditorHistorySnapshot } from "../history/historyTypes";

const STORAGE_KEY = "image-editor-project-v1";

const isStoredProject = (value: unknown): value is EditorHistorySnapshot => {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<EditorHistorySnapshot>;
  return (
    typeof project.projectName === "string" &&
    Array.isArray(project.objectLayers) &&
    Array.isArray(project.activeEffects) &&
    project.effectsByObject !== null &&
    typeof project.effectsByObject === "object" &&
    project.parametersByObject !== null &&
    typeof project.parametersByObject === "object" &&
    project.transformsByObject !== null &&
    typeof project.transformsByObject === "object"
  );
};

export function loadProject(): EditorHistorySnapshot | null {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    return isStoredProject(parsed) ? parsed : null;
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
