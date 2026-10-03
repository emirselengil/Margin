"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("margin-theme", next ? "dark" : "light");
    } catch {
      // localStorage kullanılamıyor olabilir, tema sadece bu oturumda geçerli olur.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
