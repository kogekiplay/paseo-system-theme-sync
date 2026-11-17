import { readFileSync } from "node:fs";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { install } from "../client/web";

const key = "@paseo:app-settings";
let dom;
let scheme;
let media;
let controllers;
let originalSetItem;
let Runtime;

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://paseo.test" });
  scheme = "light";
  media = new Map();
  controllers = [];
  originalSetItem = dom.window.Storage.prototype.setItem;
  dom.window.matchMedia = (query) => {
    if (!media.has(query)) {
      const events = new dom.window.EventTarget();
      media.set(query, {
        get matches() { return query.includes(scheme); },
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
        fire: () => events.dispatchEvent(new dom.window.Event("change")),
      });
    }
    return media.get(query);
  };
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("MutationObserver", dom.window.MutationObserver);
  const dependencies = {
    166: { UnistyleDependency: { Theme: 0, ThemeName: 1, AdaptiveThemes: 2 } },
    296: { ColorScheme: { Light: "light", Dark: "dark", Unspecified: "unknown" } },
    308: {}, 310: {},
    179: { isServer: () => false, schemeToTheme: (name) => name, error: (message) => new Error(message) },
  };
  // Evaluate the unchanged runtime module extracted from the installed Paseo app.
  // Its only mocked dependencies here are enums, environment helpers, and DOM.
  vm.runInNewContext(readFileSync(new URL("./fixtures/paseo-0.15.4-runtime.txt", import.meta.url), "utf8"), {
    window: dom.window, document: dom.window.document,
    __d(factory, _id, dependencyMap) {
      const module = { exports: {} };
      factory({}, (id) => dependencies[id], null, null, module, module.exports, dependencyMap);
      Runtime = module.exports.UnistylesRuntime;
    },
  });
});
afterEach(() => {
  for (const controller of controllers) controller.dispose();
  dom.window.Storage.prototype.setItem = originalSetItem;
  dom.window.close();
  vi.unstubAllGlobals();
});
function save(preference) {
  window.localStorage.setItem(key, JSON.stringify({ theme: preference, uiBaseFontSize: 14 }));
}
function start(web = true) {
  const controller = install(web);
  controllers.push(controller);
  return controller;
}
async function settle() { await new Promise((resolve) => setTimeout(resolve, 15)); }
async function system(next) {
  scheme = next;
  for (const query of media.values()) query.fire();
  await settle();
}
function runtime(fixed) {
  const services = {
    state: { hasAdaptiveThemes: false, themeName: fixed, CSSVars: true },
    listener: { emitChange() {}, emitChanges() {} },
    shadowRegistry: { getScopedTheme: () => undefined },
  };
  document.documentElement.className = fixed;
  return new Runtime(services);
}

describe("actual Paseo runtime regression", () => {
  it.each([["light", "dark"], ["dark", "light"]])(
    "reproduces a stale root palette after macOS changes %s → %s, without plugins",
    async (initial, target) => {
      scheme = initial;
      const host = runtime(target);
      host.setAdaptiveThemes(true);
      expect(document.documentElement.className).toBe(initial);
      await system(target);
      expect(host.themeName).toBe(target);
      expect(document.documentElement.className).toBe(initial);
    },
  );
  it.each([["light", "dark"], ["dark", "light"]])(
    "repairs %s → %s and subsequent system changes, without refreshing",
    async (initial, target) => {
      scheme = initial;
      const host = runtime(target);
      host.setAdaptiveThemes(true);
      await system(target);
      save("auto");
      const controller = start();
      expect(controller.getSnapshot().lastRemoved).toBe(initial);
      expect(document.documentElement.className).toBe("");
      await system(initial);
      expect(host.themeName).toBe(initial);
      expect(controller.getSnapshot().system).toBe(initial);
      expect(document.documentElement.className).toBe("");
    },
  );
  it("catches the actual runtime's root-class insertion when returning to System", async () => {
    save("dark");
    const host = runtime("dark");
    const controller = start();
    host.setAdaptiveThemes(true);
    save("auto");
    await settle();
    expect(document.documentElement.className).toBe("");
    expect(controller.getSnapshot().preference).toBe("auto");
  });
});

describe("scope and lifecycle", () => {
  it.each(["light", "dark", "zinc", "midnight", "claude", "ghostty", "pureBlack", "plugin"])(
    "preserves fixed/contributed theme %s through OS changes", async (theme) => {
      save(theme);
      document.documentElement.className = "darkZinc pluginDark custom-chrome";
      start();
      await system("dark");
      expect(document.documentElement.className).toBe("darkZinc pluginDark custom-chrome");
    },
  );
  it("removes only known theme classes and preserves other root classes", () => {
    save("auto");
    document.documentElement.className = "custom-chrome dark darkClaude pluginLight";
    const controller = start();
    expect(document.documentElement.className).toBe("custom-chrome");
    expect(controller.getSnapshot().repairs).toBe(1);
  });
  it("handles a settings save completing after the class mutation", async () => {
    save("dark");
    document.documentElement.className = "dark";
    start();
    document.documentElement.className = "light";
    await settle();
    expect(document.documentElement.className).toBe("light");
    save("auto");
    await settle();
    expect(document.documentElement.className).toBe("");
  });
  it("preserves a freshly selected fixed theme in the same event turn", async () => {
    save("auto");
    start();
    document.documentElement.className = "dark";
    save("dark");
    await settle();
    expect(document.documentElement.className).toBe("dark");
  });
  it("catches OS changes missed while hidden when the window becomes visible", async () => {
    save("auto");
    const controller = start();
    scheme = "dark"; // no media notification
    document.dispatchEvent(new window.Event("visibilitychange"));
    await settle();
    expect(controller.getSnapshot().system).toBe("dark");
  });
  it.each([null, "broken JSON", "null", "[]", '{"theme":"future-theme"}'])(
    "does not modify classes with missing/unknown/corrupt settings: %s", (raw) => {
      if (raw !== null) window.localStorage.setItem(key, raw);
      document.documentElement.className = "dark";
      start();
      expect(document.documentElement.className).toBe("dark");
    },
  );
  it("does not break the app when storage reads are restricted", () => {
    vi.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    document.documentElement.className = "dark";
    const controller = start();
    expect(controller.getSnapshot().error).toBe("denied");
    expect(document.documentElement.className).toBe("dark");
  });
  it("does not observe native clients", () => {
    const controller = start(false);
    expect(controller.getSnapshot().supported).toBe(false);
    expect(window.Storage.prototype.setItem).toBe(originalSetItem);
  });
  it("restores storage, cancels pending work, and disconnects events on dispose", async () => {
    save("auto");
    const controller = start();
    document.documentElement.className = "dark";
    controller.dispose();
    await system("dark");
    save("auto");
    window.dispatchEvent(new window.Event("focus"));
    await settle();
    expect(document.documentElement.className).toBe("dark");
    expect(window.Storage.prototype.setItem).toBe(originalSetItem);
  });
  it("leaves later storage wrappers functional after teardown", async () => {
    save("auto");
    const controller = start();
    const inner = window.Storage.prototype.setItem;
    const outer = function (...args) { return inner.apply(this, args); };
    window.Storage.prototype.setItem = outer;
    controller.dispose();
    document.documentElement.className = "dark";
    save("auto");
    await settle();
    expect(window.Storage.prototype.setItem).toBe(outer);
    expect(document.documentElement.className).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(key)).theme).toBe("auto");
  });
  it("replaces an old installation without leaving duplicate listeners", async () => {
    save("auto");
    const old = start();
    const controller = start();
    document.documentElement.className = "dark";
    await settle();
    expect(old.getSnapshot().repairs).toBe(0);
    expect(controller.getSnapshot().repairs).toBe(1);
    controller.dispose();
    expect(window.Storage.prototype.setItem).toBe(originalSetItem);
  });
});
