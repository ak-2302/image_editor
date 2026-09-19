import type { EditorHistorySnapshot } from "../history/historyTypes";
import { exportFabricProject } from "./exportFabricProject";

type ExportFormat = "png" | "jpeg";

export async function exportProject(
  snapshot: EditorHistorySnapshot,
  format: ExportFormat,
): Promise<void> {
  await exportFabricProject(snapshot, format);
}
