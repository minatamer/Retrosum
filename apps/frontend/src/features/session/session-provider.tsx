"use client";
import {
  createContext,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SessionController } from "./session-controller";

const SessionContext = createContext<SessionController | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => new SessionController());
  useEffect(() => {
    void controller.initialize();
    const timer = window.setInterval(() => {
      const session = controller.getSnapshot().session;
      if (session && session.workspace.expiresAt <= Date.now()) void controller.reset(null);
    }, 1000);
    const sweep = window.setInterval(() => void controller.sweepExpired(), 60000);
    const onPageHide = () => controller.dispose();
    window.addEventListener("pagehide", onPageHide);
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void controller.initialize();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(sweep);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      controller.dispose();
    };
  }, [controller]);
  return <SessionContext value={controller}>{children}</SessionContext>;
}
export function useSession() {
  const controller = use(SessionContext);
  if (!controller) throw new Error("A session provider is required.");
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
  return { controller, ...snapshot };
}
