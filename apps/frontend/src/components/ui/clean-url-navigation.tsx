"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { workspaceNavigationEvent, isWorkspaceView } from "../../features/workspace/navigation";
import { cancelSmoothScroll, scrollToSection } from "./smooth-scroll";

export function CleanUrlNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    const clean = () => {
      const url = new URL(window.location.href);
      if (!url.hash) return;
      let target = "";
      try {
        target = decodeURIComponent(url.hash.slice(1));
      } catch {
        // Malformed historical fragments are removed without selecting a target.
      }
      url.hash = "";
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      if (url.pathname === "/demo" && isWorkspaceView(target))
        window.dispatchEvent(
          new CustomEvent(workspaceNavigationEvent, { detail: { view: target } }),
        );
      else scrollToSection(target, target === "main");
    };
    clean();
    window.addEventListener("hashchange", clean);
    return () => {
      window.removeEventListener("hashchange", clean);
      cancelSmoothScroll();
    };
  }, [pathname]);
  return null;
}
