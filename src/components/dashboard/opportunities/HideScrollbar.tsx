"use client";

import { useEffect } from "react";

// Fix 4: Instagram-style hidden scrollbar, scoped to the opportunities route.
// The dashboard scrolls on the window, so we hide the viewport scrollbar by
// toggling `.no-scrollbar` on <html>. Added on mount, removed on unmount, so
// every other dashboard/admin page keeps its normal scrollbar. Scrolling via
// wheel/trackpad/touch/keyboard remains fully functional.
export default function HideScrollbar() {
  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector("main");
    root.classList.add("no-scrollbar");
    main?.classList.add("no-scrollbar");
    return () => {
      root.classList.remove("no-scrollbar");
      main?.classList.remove("no-scrollbar");
    };
  }, []);

  return null;
}
