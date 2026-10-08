export type WorkspaceView = "overview" | "documents" | "records";
export function navigateWorkspace(view: WorkspaceView, manual = false) {
  if (manual) window.dispatchEvent(new Event("retrosum:manual-navigation"));
  if (window.location.hash !== `#${view}`) {
    window.history.pushState(null, "", `#${view}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}
