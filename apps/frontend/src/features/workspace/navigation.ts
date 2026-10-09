export type WorkspaceView = "overview" | "documents" | "records";
export const workspaceNavigationEvent = "retrosum:workspace-navigation";

export function isWorkspaceView(value: unknown): value is WorkspaceView {
  return value === "overview" || value === "documents" || value === "records";
}

export function navigateWorkspace(view: WorkspaceView, manual = false) {
  if (manual) window.dispatchEvent(new Event("retrosum:manual-navigation"));
  window.dispatchEvent(new CustomEvent(workspaceNavigationEvent, { detail: { view } }));
}
export const workspacePanelEvent = "retrosum:workspace-panel";
export type WorkspacePanel = "settings" | "export" | "reset" | "intake";
export function openWorkspacePanel(panel: WorkspacePanel, currency: "USD" | "EUR" | null = null) {
  window.dispatchEvent(new CustomEvent(workspacePanelEvent, { detail: { panel, currency } }));
}
