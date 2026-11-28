// All browser APIs stay here; native clients get an inert controller.
declare const document: {
  documentElement: {
    classList: { contains(name: string): boolean; remove(...names: string[]): void };
    getAttribute(name: string): string | null;
  };
  visibilityState: string;
  addEventListener(name: string, listener: () => void): void;
  removeEventListener(name: string, listener: () => void): void;
};
interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
declare const window: {
  localStorage: StorageLike;
  Storage: { prototype: StorageLike };
  matchMedia(query: string): {
    matches: boolean;
    addEventListener(name: string, listener: () => void): void;
    removeEventListener(name: string, listener: () => void): void;
  };
  addEventListener(name: string, listener: () => void): void;
  removeEventListener(name: string, listener: () => void): void;
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
};
declare class MutationObserver {
  constructor(callback: () => void);
  observe(target: unknown, options: { attributes: boolean; attributeFilter: string[] }): void;
  disconnect(): void;
}

export interface SyncSnapshot {
  supported: boolean;
  preference: string | null;
  system: "light" | "dark" | "unknown";
  rootClasses: string;
  repairs: number;
  lastRemoved: string;
  error: string | null;
}
export interface SyncController {
  getSnapshot(): SyncSnapshot;
  subscribe(listener: () => void): () => void;
  sync(): void;
  dispose(): void;
}

const SETTINGS_KEY = "@paseo:app-settings";
const LEGACY_KEY = "@paseo:settings";
const OWNER = Symbol.for("paseo.system-theme-sync.owner");
// Registered theme names verified through Paseo 0.18.1.
// Never touch unrelated root classes.
const THEME_CLASSES = [
  "light", "dark", "darkZinc", "darkMidnight", "darkClaude", "darkGhostty",
  "darkPureBlack", "pluginLight", "pluginDark",
];

export function install(isWeb: boolean): SyncController {
  let snapshot: SyncSnapshot = {
    supported: false, preference: null, system: "unknown", rootClasses: "",
    repairs: 0, lastRemoved: "", error: null,
  };
  const listeners = new Set<() => void>();
  const controller: SyncController = {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    sync: () => {}, dispose: () => { listeners.clear(); },
  };
  if (!isWeb || typeof window === "undefined" || typeof document === "undefined") return controller;
  const previous: unknown = Reflect.get(document, OWNER);
  if (typeof previous === "function") previous();
  const root = document.documentElement;
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const light = window.matchMedia("(prefers-color-scheme: light)");
  let disposed = false;
  let timer: number | null = null;
  let repairs = 0;
  let lastRemoved = "";

  function sync() {
    if (disposed) return;
    let preference: string | null = null;
    let error: string | null = null;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
      // Fail closed while settings are missing, blocked, or corrupted.
      const settings: unknown = raw === null ? null : JSON.parse(raw);
      if (settings !== null && typeof settings === "object" && !Array.isArray(settings)) {
        const value: unknown = Reflect.get(settings, "theme");
        preference = typeof value === "string" ? value : null;
      }
      if (preference === "auto") {
        const stale = THEME_CLASSES.filter((name) => root.classList.contains(name));
        if (stale.length > 0) {
          root.classList.remove(...stale);
          repairs += 1;
          lastRemoved = stale.join(", ");
        }
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }
    const next: SyncSnapshot = {
      supported: true, preference, system: dark.matches ? "dark" : light.matches ? "light" : "unknown",
      rootClasses: root.getAttribute("class") ?? "", repairs, lastRemoved, error,
    };
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    for (const listener of listeners) listener();
  }
  function schedule() {
    if (disposed || timer !== null) return;
    // Let the app finish its settings write before inspecting the preference.
    timer = window.setTimeout(() => { timer = null; sync(); }, 0);
  }
  const observer = new MutationObserver(schedule);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  dark.addEventListener("change", schedule);
  light.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("focus", schedule);
  window.addEventListener("pageshow", schedule);
  window.addEventListener("storage", schedule);

  // Same-window writes do not emit storage events. Observe only Paseo's settings
  // keys after delegating with the original receiver/arguments. A later wrapper
  // can keep calling this function safely after disposal; it becomes inert.
  const prototype = window.Storage.prototype;
  const originalDescriptor = Object.getOwnPropertyDescriptor(prototype, "setItem");
  const originalSetItem = prototype.setItem;
  function setItem(this: StorageLike, key: string, value: string) {
    const result = originalSetItem.call(this, key, value);
    if (!disposed && (key === SETTINGS_KEY || key === LEGACY_KEY)) schedule();
    return result;
  }
  let hooked = false;
  try {
    Object.defineProperty(prototype, "setItem", { ...originalDescriptor, value: setItem });
    hooked = true;
  } catch {
    // Root mutations and OS/visibility events still repair the normal path.
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    if (timer !== null) window.clearTimeout(timer);
    observer.disconnect();
    dark.removeEventListener("change", schedule);
    light.removeEventListener("change", schedule);
    document.removeEventListener("visibilitychange", schedule);
    window.removeEventListener("focus", schedule);
    window.removeEventListener("pageshow", schedule);
    window.removeEventListener("storage", schedule);
    if (hooked && prototype.setItem === setItem && originalDescriptor) {
      Object.defineProperty(prototype, "setItem", originalDescriptor);
    }
    if (Reflect.get(document, OWNER) === dispose) Reflect.deleteProperty(document, OWNER);
    listeners.clear();
    // Do not restore stale classes: the app's current theme remains valid.
  }
  controller.sync = sync;
  controller.dispose = dispose;
  Reflect.set(document, OWNER, dispose);
  sync();
  return controller;
}
