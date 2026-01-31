import { useEffect, useState } from "react";

export function useRuntime() {
  const [runtime, setRuntime] = useState("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTauri =
      Boolean(window.__TAURI__) ||
      Boolean(window.__TAURI_INTERNALS__);

    setRuntime(isTauri ? "tauri" : "web");
  }, []);

  return {
    runtime,
    isTauri: runtime === "tauri",
    isWeb: runtime === "web",
    isReady: runtime !== "unknown",
  };
}
