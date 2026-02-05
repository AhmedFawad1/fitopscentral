"use client";

import { useEffect } from "react";

export default function HashScrollFix() {
  useEffect(() => {
    if (!window.location.hash) return;

    const id = window.location.hash.slice(1);
    let tries = 0;

    const scrollToTarget = () => {
      const el = document.getElementById(id);

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (tries < 20) {
        tries++;
        requestAnimationFrame(scrollToTarget);
      }
    };

    scrollToTarget();
  }, []);

  return null;
}
